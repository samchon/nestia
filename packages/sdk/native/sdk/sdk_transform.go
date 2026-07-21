package sdk

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimchecker "github.com/microsoft/typescript-go/shim/checker"
	shimscanner "github.com/microsoft/typescript-go/shim/scanner"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	nativecontext "github.com/samchon/typia/packages/typia/native/core/context"
	nativefactories "github.com/samchon/typia/packages/typia/native/core/factories"
	nativeiterate "github.com/samchon/typia/packages/typia/native/core/programmers/iterate"
	nativejson "github.com/samchon/typia/packages/typia/native/core/programmers/json"
	schemametadata "github.com/samchon/typia/packages/typia/native/core/schemas/metadata"
)

type nestiaSDKSite struct {
	File       *shimast.SourceFile
	FilePath   string
	ClassName  string
	MethodName string
	Method     *shimast.Node
	Metadata   string
}

type nestiaSDKContext struct {
	prog          *driver.Program
	collection    *schemametadata.MetadataCollection
	importsByFile map[string][]nestiaSDKImportInfo
	schemaCache   map[nestiaSDKSchemaCacheKey]any
	schemaHits    int
	schemaMisses  int
}

type nestiaSDKSchemaCacheKey struct {
	Type   *shimchecker.Type
	Text   string
	Escape bool
}

func newNestiaSDKContext(prog *driver.Program) *nestiaSDKContext {
	return &nestiaSDKContext{
		prog:          prog,
		collection:    newNestiaSDKMetadataCollection(),
		importsByFile: map[string][]nestiaSDKImportInfo{},
		schemaCache:   map[nestiaSDKSchemaCacheKey]any{},
	}
}

func newNestiaSDKMetadataCollection() *schemametadata.MetadataCollection {
	return schemametadata.NewMetadataCollection(
		&schemametadata.MetadataCollection_IOptions{
			Replace: schemametadata.MetadataCollection_replace,
		},
	)
}

func (ctx *nestiaSDKContext) imports(file *shimast.SourceFile) []nestiaSDKImportInfo {
	if file == nil {
		return nil
	}
	name := filepath.ToSlash(file.FileName())
	if imports, ok := ctx.importsByFile[name]; ok {
		return imports
	}
	imports := nestiaSDKAnalyzeImports(file)
	ctx.importsByFile[name] = imports
	return imports
}
func collectNestiaSDKSites(prog *driver.Program) ([]nestiaSDKSite, []transform.Diagnostic) {
	sites := []nestiaSDKSite{}
	diagnostics := []transform.Diagnostic{}
	context := newNestiaSDKContext(prog)
	for _, file := range prog.SourceFiles() {
		if file == nil || file.IsDeclarationFile {
			continue
		}
		visited := map[string]bool{}
		file.ForEachChild(func(node *shimast.Node) bool {
			visitNestiaSDKNode(context, file, node, visited, &sites, &diagnostics)
			return false
		})
	}
	if os.Getenv("TTSC_NESTIA_PROFILE") != "" {
		fmt.Fprintf(stderr, "ttsc-nestia profile: sdk-schema-cache hits=%d misses=%d\n", context.schemaHits, context.schemaMisses)
	}
	return sites, diagnostics
}

func visitNestiaSDKNode(
	context *nestiaSDKContext,
	file *shimast.SourceFile,
	node *shimast.Node,
	visited map[string]bool,
	sites *[]nestiaSDKSite,
	diagnostics *[]transform.Diagnostic,
) {
	if node == nil {
		return
	}
	if node.Kind == shimast.KindMethodDeclaration && len(node.Decorators()) != 0 {
		className := nestiaSDKParentClassName(node)
		methodName := nestiaSDKMethodName(node)
		if className != "" && methodName != "" {
			key := className + "." + methodName
			if visited[key] == false {
				visited[key] = true
				metadata, err := nestiaSDKMetadataText(context, file, node)
				site := nestiaSDKSite{
					File:       file,
					FilePath:   file.FileName(),
					ClassName:  className,
					MethodName: methodName,
					Method:     node,
					Metadata:   metadata,
				}
				if err != nil {
					*diagnostics = append(*diagnostics, nestiaSDKDiagnostic(site, err.Error()))
				} else {
					*sites = append(*sites, site)
				}
			}
		}
	}
	node.ForEachChild(func(child *shimast.Node) bool {
		visitNestiaSDKNode(context, file, child, visited, sites, diagnostics)
		return false
	})
}

func nestiaSDKMetadataText(context *nestiaSDKContext, file *shimast.SourceFile, method *shimast.Node) (string, error) {
	prog := context.prog
	methodDecl := method.AsMethodDeclaration()
	imports := context.imports(file)
	doc := nestiaSDKMethodJSDoc(file, method)
	parameters := []any{}
	if methodDecl.Parameters != nil {
		for index, param := range methodDecl.Parameters.Nodes {
			typ := prog.Checker.GetTypeAtLocation(param)
			name := nestiaSDKParameterName(param)
			response := nestiaSDKResponse(context, imports, typ, nestiaSDKParameterTypeNode(param))
			parameters = append(parameters, map[string]any{
				"name":        name,
				"index":       index,
				"description": nestiaSDKNullableString(doc.Params[name]),
				"jsDocTags":   []any{},
				"type":        response["type"],
				"imports":     response["imports"],
				"primitive":   response["primitive"],
				"resolved":    response["resolved"],
			})
		}
	}
	returnType := transform.NestiaCoreMethodReturnType(prog, method)
	returnTypeNode := nestiaSDKMethodReturnTypeNode(prog, method)
	exceptions := nestiaSDKExceptionResponses(context, imports, method)
	metadata := map[string]any{
		"parameters":  parameters,
		"success":     nestiaSDKResponse(context, imports, returnType, returnTypeNode),
		"exceptions":  exceptions,
		"description": nestiaSDKNullableString(doc.Description),
		"jsDocTags":   doc.Tags,
	}
	return nestiaSDKMetadataLiteralText(metadata)
}

const nestiaSDKLiteralNull = "__NESTIA_LITERAL_NULL__"

func nestiaSDKMetadataLiteralText(metadata map[string]any) (string, error) {
	data, err := json.Marshal(metadata)
	if err != nil {
		return "", err
	}
	text := string(data)
	text = strings.ReplaceAll(text, `"`+nestiaSDKLiteralNull+`"`, "null")
	return text, nil
}

type nestiaSDKJSDoc struct {
	Description string
	Tags        []any
	Params      map[string]string
}

func nestiaSDKMethodJSDoc(file *shimast.SourceFile, method *shimast.Node) nestiaSDKJSDoc {
	doc := nestiaSDKJSDoc{
		Tags:   []any{},
		Params: map[string]string{},
	}
	source, ok := transform.SourceFileText(file)
	if ok == false || method == nil {
		return doc
	}
	comment := nestiaSDKLeadingJSDoc(source, method)
	if comment == "" {
		return doc
	}
	description := []string{}
	inTags := false
	for _, line := range strings.Split(comment, "\n") {
		text := strings.TrimSpace(line)
		text = strings.TrimPrefix(text, "*")
		text = strings.TrimSpace(text)
		if text == "" {
			if inTags == false && len(description) != 0 {
				description = append(description, "")
			}
			continue
		}
		if strings.HasPrefix(text, "@") {
			inTags = true
			name, body := nestiaSDKParseJSDocTag(text)
			doc.Tags = append(doc.Tags, nestiaSDKJSDocTag(name, body))
			if name == "param" {
				param, desc := nestiaSDKParseParamTag(body)
				if param != "" {
					doc.Params[param] = desc
				}
			}
			continue
		}
		if inTags == false {
			description = append(description, text)
		}
	}
	doc.Description = strings.TrimSpace(strings.Join(description, "\n"))
	return doc
}

func nestiaSDKLeadingJSDoc(source string, method *shimast.Node) string {
	positions := []int{method.Pos()}
	if decorators := method.Decorators(); len(decorators) != 0 {
		positions = append(positions, decorators[0].Pos())
	}
	for _, pos := range positions {
		if pos < 0 || pos > len(source) {
			continue
		}
		if comment := nestiaSDKJSDocAtOrBefore(source, pos); comment != "" {
			return comment
		}
	}
	return ""
}

func nestiaSDKJSDocAtOrBefore(source string, pos int) string {
	cursor := pos
	for cursor < len(source) && (source[cursor] == ' ' || source[cursor] == '\t' || source[cursor] == '\r' || source[cursor] == '\n') {
		cursor++
	}
	if strings.HasPrefix(source[cursor:], "/**") {
		if end := strings.Index(source[cursor:], "*/"); end >= 0 {
			return source[cursor+3 : cursor+end]
		}
	}
	left := pos
	for left > 0 && (source[left-1] == ' ' || source[left-1] == '\t' || source[left-1] == '\r' || source[left-1] == '\n') {
		left--
	}
	if left < 2 || source[left-2:left] != "*/" {
		return ""
	}
	start := strings.LastIndex(source[:left-2], "/**")
	if start < 0 {
		return ""
	}
	return source[start+3 : left-2]
}

func nestiaSDKParseJSDocTag(text string) (string, string) {
	text = strings.TrimPrefix(text, "@")
	parts := strings.Fields(text)
	if len(parts) == 0 {
		return "", ""
	}
	name := parts[0]
	body := strings.TrimSpace(strings.TrimPrefix(text, name))
	return name, body
}

func nestiaSDKParseParamTag(body string) (string, string) {
	parts := strings.Fields(body)
	if len(parts) == 0 {
		return "", ""
	}
	param := parts[0]
	desc := strings.TrimSpace(strings.TrimPrefix(body, param))
	return param, desc
}

func nestiaSDKJSDocTag(name string, text string) map[string]any {
	if text == "" {
		return map[string]any{
			"name": name,
		}
	}
	return map[string]any{
		"name": name,
		"text": []any{
			map[string]any{
				"text": text,
				"kind": "text",
			},
		},
	}
}

func nestiaSDKNullableString(value string) any {
	value = strings.TrimSpace(value)
	if value == "" {
		return nestiaSDKLiteralNull
	}
	return value
}

func nestiaSDKExceptionResponses(
	context *nestiaSDKContext,
	imports []nestiaSDKImportInfo,
	method *shimast.Node,
) []any {
	prog := context.prog
	responses := []any{}
	for _, decorator := range method.Decorators() {
		exception := nestiaSDKTypedExceptionInfo(prog, decorator)
		if exception == nil {
			continue
		}
		responses = append(responses, nestiaSDKResponse(context, imports, exception.Type, exception.Node))
	}
	return responses
}

type nestiaSDKTypedException struct {
	Type *shimchecker.Type
	Node *shimast.Node
}

func nestiaSDKTypedExceptionInfo(prog *driver.Program, decorator *shimast.Node) *nestiaSDKTypedException {
	if decorator == nil || decorator.Kind != transform.NestiaCoreKindDecorator {
		return nil
	}
	expression := decorator.AsDecorator().Expression
	if expression == nil || expression.Kind != shimast.KindCallExpression {
		return nil
	}
	call := expression.AsCallExpression()
	segments := transform.NestiaCoreExpressionSegments(call.Expression)
	if len(segments) == 0 || segments[len(segments)-1] != "TypedException" {
		return nil
	}
	if transform.IsNestiaCoreCall(prog, expression) == false {
		return nil
	}
	if call.TypeArguments == nil || len(call.TypeArguments.Nodes) != 1 {
		return nil
	}
	node := call.TypeArguments.Nodes[0]
	return &nestiaSDKTypedException{
		Type: prog.Checker.GetTypeFromTypeNode(node),
		Node: node,
	}
}

type nestiaSDKImportInfo struct {
	File     string
	Asterisk string
	Default  string
	Elements []string
}

func nestiaSDKAnalyzeImports(file *shimast.SourceFile) []nestiaSDKImportInfo {
	if file == nil || file.Statements == nil {
		return nil
	}
	output := []nestiaSDKImportInfo{}
	for _, stmt := range file.Statements.Nodes {
		if stmt == nil || stmt.Kind != shimast.KindImportDeclaration {
			continue
		}
		decl := stmt.AsImportDeclaration()
		if decl == nil || decl.ImportClause == nil || decl.ModuleSpecifier == nil || decl.ModuleSpecifier.Kind != shimast.KindStringLiteral {
			continue
		}
		clause := decl.ImportClause.AsImportClause()
		if clause == nil {
			continue
		}
		info := nestiaSDKImportInfo{
			File:     nestiaSDKNormalizeImportPath(file.FileName(), decl.ModuleSpecifier.Text()),
			Elements: []string{},
		}
		if name := clause.Name(); name != nil {
			info.Default = name.Text()
		}
		if clause.NamedBindings != nil {
			if clause.NamedBindings.Kind == shimast.KindNamespaceImport {
				if name := clause.NamedBindings.Name(); name != nil {
					info.Asterisk = name.Text()
				}
			} else if clause.NamedBindings.Kind == shimast.KindNamedImports {
				named := clause.NamedBindings.AsNamedImports()
				if named != nil && named.Elements != nil {
					for _, elem := range named.Elements.Nodes {
						if elem == nil {
							continue
						}
						spec := elem.AsImportSpecifier()
						if spec == nil {
							continue
						}
						if name := spec.Name(); name != nil {
							info.Elements = append(info.Elements, name.Text())
						}
					}
				}
			}
		}
		output = append(output, info)
	}
	return output
}

func nestiaSDKNormalizeImportPath(fileName string, module string) string {
	if strings.HasPrefix(module, ".") {
		return filepath.ToSlash(filepath.Clean(filepath.Join(filepath.Dir(fileName), module)))
	}
	return filepath.ToSlash(filepath.Join("node_modules", module))
}

func nestiaSDKReflectImports(name string, imports []nestiaSDKImportInfo) []any {
	prefixes := nestiaSDKTypePrefixes(name)
	output := []any{}
	seen := map[string]bool{}
	for _, imp := range imports {
		if nestiaSDKImportMatches(prefixes, imp) == false {
			continue
		}
		item := nestiaSDKImportLiteral(imp, prefixes)
		key := fmt.Sprintf("%v", item)
		if seen[key] {
			continue
		}
		seen[key] = true
		output = append(output, item)
	}
	return output
}

func nestiaSDKTypePrefixes(name string) map[string]bool {
	output := map[string]bool{}
	re := regexp.MustCompile(`[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)*`)
	for _, match := range re.FindAllString(name, -1) {
		prefix := strings.Split(match, ".")[0]
		if nestiaSDKIsGlobalTypePrefix(prefix) == false {
			output[prefix] = true
		}
	}
	return output
}

func nestiaSDKIsGlobalTypePrefix(prefix string) bool {
	switch prefix {
	case "any", "unknown", "never", "void", "null", "undefined",
		"string", "number", "boolean", "bigint", "symbol", "object",
		"Array", "ReadonlyArray", "Promise", "Record", "Partial", "Pick", "Omit",
		"Date", "File", "Blob", "Uint8Array", "ArrayBuffer", "Error":
		return true
	default:
		return false
	}
}

func nestiaSDKImportMatches(prefixes map[string]bool, imp nestiaSDKImportInfo) bool {
	if imp.Default != "" && prefixes[imp.Default] {
		return true
	}
	if imp.Asterisk != "" && prefixes[imp.Asterisk] {
		return true
	}
	for _, elem := range imp.Elements {
		if prefixes[elem] {
			return true
		}
	}
	return false
}

func nestiaSDKImportLiteral(imp nestiaSDKImportInfo, prefixes map[string]bool) map[string]any {
	elements := []string{}
	for _, elem := range imp.Elements {
		if prefixes[elem] {
			elements = append(elements, elem)
		}
	}
	asterisk := any(nestiaSDKLiteralNull)
	if imp.Asterisk != "" && prefixes[imp.Asterisk] {
		asterisk = imp.Asterisk
	}
	def := any(nestiaSDKLiteralNull)
	if imp.Default != "" && prefixes[imp.Default] {
		def = imp.Default
	}
	return map[string]any{
		"file":     imp.File,
		"asterisk": asterisk,
		"default":  def,
		"elements": elements,
	}
}

func nestiaSDKResponse(
	context *nestiaSDKContext,
	imports []nestiaSDKImportInfo,
	typ *shimchecker.Type,
	typeNode *shimast.Node,
) map[string]any {
	prog := context.prog
	refType, refImports := nestiaSDKReflectType(prog, imports, typ, typeNode)
	if refImports == nil {
		refImports = []any{}
	}
	return map[string]any{
		"type":      refType,
		"imports":   refImports,
		"primitive": nestiaSDKSchemaPipe(context, typ, typeNode, true),
		"resolved":  nestiaSDKSchemaPipe(context, typ, typeNode, false),
	}
}

func nestiaSDKSchemaPipe(context *nestiaSDKContext, typ *shimchecker.Type, typeNode *shimast.Node, escape bool) any {
	prog := context.prog
	key := nestiaSDKSchemaCacheKey{
		Type:   typ,
		Text:   nestiaSDKTypeNodeText(typeNode),
		Escape: escape,
	}
	if cached, ok := context.schemaCache[key]; ok {
		context.schemaHits++
		return cached
	}
	context.schemaMisses++
	if nestiaSDKIsTypeGuardError(prog, typ, typeNode) {
		value := nestiaSDKTypeGuardErrorSchemaPipe()
		context.schemaCache[key] = value
		return value
	}
	result := nativefactories.MetadataFactory.Analyze(nativefactories.MetadataFactory_IProps{
		Checker: prog.Checker,
		Options: nativefactories.MetadataFactory_IOptions{
			Escape:   escape,
			Constant: true,
			Absorb:   true,
		},
		Components: context.collection,
		Type:       typ,
	})
	if result.Success == false {
		errors := []any{}
		for _, err := range result.Errors {
			errors = append(errors, map[string]any{
				"name":     err.Name,
				"accessor": nestiaSDKLiteralNull,
				"messages": err.Messages,
			})
		}
		failure := map[string]any{
			"success": false,
			"errors":  errors,
		}
		context.schemaCache[key] = failure
		return failure
	}
	nestiaSDKRestoreUnionOrder(typeNode, result.Data)
	// Pre-bake the values that the legacy `@typia/core` 12.x `MetadataSchema`
	// class exposed as runtime methods (.size(), .getName(), .empty()) and
	// the OpenAPI 3.1 schema typia v13 only produces on the Go side. nestia
	// reads them through the `packages/sdk/src/internal/legacy.ts` namespace
	// utilities so no JS-side class wrapper or vendored package is needed.
	metadataLiteral := nestiaSDKMetadataSchemaLiteral(result.Data.ToJSON()).(map[string]any)
	metadataLiteral["size"] = result.Data.Size()
	metadataLiteral["name"] = result.Data.GetName()
	metadataLiteral["empty"] = result.Data.Empty()
	// `JsonSchemasProgrammer.WriteSchemas` panics on metadata that has no
	// JSON-schema representation (e.g. a `void` route return or a parameter
	// whose only members are functions). The legacy reader on the JS side
	// already treats a missing `jsonSchema` as "skip", so swallow the panic
	// and omit the field — the sdk generator falls back to its own derived
	// schema path. This must never mask a real bug, so re-raise anything we
	// don't recognize as a transformer error from the typia runtime.
	if baked := nestiaSDKTryBakeJsonSchema(prog, typeNode, result.Data); baked != nil {
		metadataLiteral["jsonSchema"] = baked
	}
	value := map[string]any{
		"success": true,
		"data": map[string]any{
			"components": nestiaSDKMetadataComponentsLiteral(nestiaSDKVisitedMetadataComponents(context.collection, result.Data)),
			"metadata":   metadataLiteral,
		},
	}
	context.schemaCache[key] = value
	return value
}

// nestiaSDKTryBakeJsonSchema runs `JsonSchemasProgrammer.WriteSchemas` for a
// single metadata and returns the OpenAPI 3.1 schema literal. Returns nil
// when typia signals the metadata has no JSON-schema representation (e.g.
// `void` returns, function-only types) — the JS-side reader handles missing
// `jsonSchema` fields. Any other panic is re-raised so real bugs surface.
func nestiaSDKTryBakeJsonSchema(
	prog *driver.Program,
	typeNode *shimast.Node,
	metadata *schemametadata.MetadataSchema,
) (baked map[string]any) {
	defer func() {
		if r := recover(); r != nil {
			if _, ok := r.(*nativecontext.TransformerError); ok {
				baked = nil
				return
			}
			panic(r)
		}
	}()
	collection := nativejson.JsonSchemasProgrammer.WriteSchemas(struct {
		Version   string
		Metadatas []*schemametadata.MetadataSchema
	}{
		Version:   "3.1",
		Metadatas: []*schemametadata.MetadataSchema{metadata},
	})
	if len(collection.Schemas) == 0 {
		return nil
	}
	// `iterate.OpenApi_IComponents` has no JSON tags on its Schemas field,
	// so default Go marshaling would emit `"Schemas"` (capital). The JS
	// side reads `components.schemas`, so flatten to a plain map here.
	componentsLiteral := map[string]any{"schemas": map[string]any{}}
	if collection.Components != nil && collection.Components.Schemas != nil {
		schemasLiteral := map[string]any{}
		for key, val := range collection.Components.Schemas {
			schemasLiteral[key] = map[string]any(val)
		}
		componentsLiteral["schemas"] = schemasLiteral
	}
	baked = map[string]any{
		"version":    collection.Version,
		"components": componentsLiteral,
		"schema":     map[string]any(collection.Schemas[0]),
	}
	nestiaSDKMarkReadonlyArrayJsonSchema(prog, typeNode, baked)
	return baked
}

func nestiaSDKMarkReadonlyArrayJsonSchema(prog *driver.Program, typeNode *shimast.Node, baked map[string]any) {
	components, _ := baked["components"].(map[string]any)
	schemas, _ := components["schemas"].(map[string]any)
	schema := nestiaSDKSchemaMap(baked["schema"])
	nestiaSDKMarkReadonlyArraySchemaNode(
		prog,
		typeNode,
		schema,
		schemas,
		map[*shimast.Node]bool{},
	)
}

func nestiaSDKMarkReadonlyArraySchemaNode(
	prog *driver.Program,
	typeNode *shimast.Node,
	schema map[string]any,
	components map[string]any,
	visiting map[*shimast.Node]bool,
) {
	if typeNode == nil || schema == nil {
		return
	}
	if visiting[typeNode] {
		return
	}
	visiting[typeNode] = true
	defer delete(visiting, typeNode)

	switch typeNode.Kind {
	case shimast.KindArrayType:
		child := nestiaSDKSchemaMap(schema["items"])
		nestiaSDKMarkReadonlyArraySchemaNode(
			prog,
			typeNode.AsArrayTypeNode().ElementType,
			child,
			components,
			visiting,
		)
	case shimast.KindTupleType:
		tuple := typeNode.AsTupleTypeNode()
		items := nestiaSDKSchemaList(schema["prefixItems"])
		if tuple.Elements != nil {
			for i, elem := range tuple.Elements.Nodes {
				if i >= len(items) {
					break
				}
				child := nestiaSDKSchemaMap(items[i])
				nestiaSDKMarkReadonlyArraySchemaNode(prog, elem, child, components, visiting)
			}
		}
	case shimast.KindParenthesizedType:
		nestiaSDKMarkReadonlyArraySchemaNode(
			prog,
			typeNode.AsParenthesizedTypeNode().Type,
			schema,
			components,
			visiting,
		)
	case shimast.KindTypeOperator:
		operator := typeNode.AsTypeOperatorNode()
		if nestiaSDKTypeOperatorPrefix(typeNode, operator.Type) == "readonly" &&
			nestiaSDKReadonlyArrayOperand(operator.Type) {
			schema["x-readonly-array"] = true
		}
		nestiaSDKMarkReadonlyArraySchemaNode(
			prog,
			operator.Type,
			schema,
			components,
			visiting,
		)
	case shimast.KindTypeReference:
		nestiaSDKMarkReadonlyArrayTypeReference(
			prog,
			typeNode,
			schema,
			components,
			visiting,
		)
	case shimast.KindTypeLiteral:
		nestiaSDKMarkReadonlyArrayTypeElements(
			prog,
			typeNode.AsTypeLiteralNode().Members,
			schema,
			components,
			visiting,
		)
	}
}

func nestiaSDKMarkReadonlyArrayTypeReference(
	prog *driver.Program,
	typeNode *shimast.Node,
	schema map[string]any,
	components map[string]any,
	visiting map[*shimast.Node]bool,
) {
	ref := typeNode.AsTypeReferenceNode()
	name := nestiaSDKEntityNameText(ref.TypeName)
	if name == "ReadonlyArray" {
		schema["x-readonly-array"] = true
	}
	if (name == "Array" || name == "ReadonlyArray") && ref.TypeArguments != nil &&
		len(ref.TypeArguments.Nodes) != 0 {
		child := nestiaSDKSchemaMap(schema["items"])
		nestiaSDKMarkReadonlyArraySchemaNode(
			prog,
			ref.TypeArguments.Nodes[0],
			child,
			components,
			visiting,
		)
	}
	for _, decl := range nestiaSDKTypeReferenceDeclarations(prog, ref.TypeName) {
		switch decl.Kind {
		case shimast.KindInterfaceDeclaration:
			target := nestiaSDKReferencedSchema(schema, components, name)
			nestiaSDKMarkReadonlyArrayTypeElements(
				prog,
				decl.AsInterfaceDeclaration().Members,
				target,
				components,
				visiting,
			)
		case shimast.KindTypeAliasDeclaration:
			target := nestiaSDKReferencedSchema(schema, components, name)
			nestiaSDKMarkReadonlyArraySchemaNode(
				prog,
				decl.AsTypeAliasDeclaration().Type,
				target,
				components,
				visiting,
			)
		}
	}
}

func nestiaSDKMarkReadonlyArrayTypeElements(
	prog *driver.Program,
	members *shimast.TypeElementList,
	schema map[string]any,
	components map[string]any,
	visiting map[*shimast.Node]bool,
) {
	if members == nil || schema == nil {
		return
	}
	properties := nestiaSDKSchemaMap(schema["properties"])
	if properties == nil {
		return
	}
	for _, member := range members.Nodes {
		if member == nil || member.Kind != shimast.KindPropertySignature {
			continue
		}
		property := member.AsPropertySignatureDeclaration()
		name := nestiaSDKSchemaPropertyName(property.Name())
		child := nestiaSDKSchemaMap(properties[name])
		nestiaSDKMarkReadonlyArraySchemaNode(
			prog,
			property.Type,
			child,
			components,
			visiting,
		)
	}
}

func nestiaSDKTypeReferenceDeclarations(prog *driver.Program, node *shimast.Node) []*shimast.Node {
	if prog == nil || prog.Checker == nil || node == nil {
		return nil
	}
	symbol := prog.Checker.GetSymbolAtLocation(node)
	if symbol == nil {
		typ := prog.Checker.GetTypeFromTypeNode(node)
		if typ != nil {
			symbol = typ.Symbol()
		}
	}
	if symbol == nil {
		return nil
	}
	return symbol.Declarations
}

func nestiaSDKReferencedSchema(schema map[string]any, components map[string]any, name string) map[string]any {
	ref, _ := schema["$ref"].(string)
	if ref == "" {
		return schema
	}
	const prefix = "#/components/schemas/"
	if strings.HasPrefix(ref, prefix) {
		name = strings.TrimPrefix(ref, prefix)
	}
	target := nestiaSDKSchemaMap(components[name])
	if target != nil {
		return target
	}
	return schema
}

func nestiaSDKSchemaMap(input any) map[string]any {
	switch value := input.(type) {
	case map[string]any:
		return value
	case nativeiterate.JsonSchema:
		return map[string]any(value)
	default:
		return nil
	}
}

func nestiaSDKSchemaList(input any) []any {
	switch value := input.(type) {
	case []any:
		return value
	case []nativeiterate.JsonSchema:
		output := make([]any, len(value))
		for i, elem := range value {
			output[i] = elem
		}
		return output
	default:
		return nil
	}
}

func nestiaSDKReadonlyArrayOperand(node *shimast.Node) bool {
	if node == nil {
		return false
	}
	switch node.Kind {
	case shimast.KindArrayType, shimast.KindTupleType:
		return true
	case shimast.KindTypeReference:
		return nestiaSDKEntityNameText(node.AsTypeReferenceNode().TypeName) == "Array"
	case shimast.KindParenthesizedType:
		return nestiaSDKReadonlyArrayOperand(node.AsParenthesizedTypeNode().Type)
	default:
		return false
	}
}

func nestiaSDKSchemaPropertyName(node *shimast.Node) string {
	text := nestiaSDKTypeNodeText(node)
	return strings.Trim(text, "\"'")
}

func nestiaSDKRestoreUnionOrder(typeNode *shimast.Node, metadata *schemametadata.MetadataSchema) {
	if typeNode == nil || metadata == nil || typeNode.Kind != shimast.KindUnionType {
		return
	}
	types := typeNode.AsUnionTypeNode().Types
	if types == nil || len(types.Nodes) == 0 {
		return
	}
	order := map[string]int{}
	for index, child := range types.Nodes {
		for _, name := range nestiaSDKUnionTypeNames(child) {
			if _, ok := order[name]; ok == false {
				order[name] = index
			}
		}
	}
	if len(order) == 0 {
		return
	}
	sort.SliceStable(metadata.Objects, func(i, j int) bool {
		return nestiaSDKUnionRank(order, metadata.Objects[i].Type.Name) < nestiaSDKUnionRank(order, metadata.Objects[j].Type.Name)
	})
	sort.SliceStable(metadata.Aliases, func(i, j int) bool {
		return nestiaSDKUnionRank(order, metadata.Aliases[i].Type.Name) < nestiaSDKUnionRank(order, metadata.Aliases[j].Type.Name)
	})
	sort.SliceStable(metadata.Arrays, func(i, j int) bool {
		return nestiaSDKUnionRank(order, metadata.Arrays[i].Type.Name) < nestiaSDKUnionRank(order, metadata.Arrays[j].Type.Name)
	})
	sort.SliceStable(metadata.Tuples, func(i, j int) bool {
		return nestiaSDKUnionRank(order, metadata.Tuples[i].Type.Name) < nestiaSDKUnionRank(order, metadata.Tuples[j].Type.Name)
	})
}

func nestiaSDKVisitedMetadataComponents(
	collection *schemametadata.MetadataCollection,
	metadata *schemametadata.MetadataSchema,
) schemametadata.IMetadataComponents {
	visited := map[string]bool{}
	nestiaSDKVisitMetadataSchema(metadata, visited, map[*schemametadata.MetadataSchema]bool{})
	filtered := schemametadata.IMetadataComponents{
		Objects: []schemametadata.IMetadataSchema_IObjectType{},
		Aliases: []schemametadata.IMetadataSchema_IAliasType{},
		Arrays:  []schemametadata.IMetadataSchema_IArrayType{},
		Tuples:  []schemametadata.IMetadataSchema_ITupleType{},
	}
	for _, obj := range collection.Objects() {
		if obj != nil && visited[obj.Name] {
			filtered.Objects = append(filtered.Objects, obj.ToJSON())
		}
	}
	for _, alias := range collection.Aliases() {
		if alias != nil && visited[alias.Name] {
			filtered.Aliases = append(filtered.Aliases, alias.ToJSON())
		}
	}
	for _, array := range collection.Arrays() {
		if array != nil && visited[array.Name] {
			filtered.Arrays = append(filtered.Arrays, array.ToJSON())
		}
	}
	for _, tuple := range collection.Tuples() {
		if tuple != nil && visited[tuple.Name] {
			filtered.Tuples = append(filtered.Tuples, tuple.ToJSON())
		}
	}
	return filtered
}

func nestiaSDKVisitMetadataSchema(
	metadata *schemametadata.MetadataSchema,
	visited map[string]bool,
	seen map[*schemametadata.MetadataSchema]bool,
) {
	if metadata == nil || seen[metadata] {
		return
	}
	seen[metadata] = true
	if metadata.Escaped != nil {
		nestiaSDKVisitMetadataSchema(metadata.Escaped.Original, visited, seen)
		nestiaSDKVisitMetadataSchema(metadata.Escaped.Returns, visited, seen)
	}
	if metadata.Rest != nil {
		nestiaSDKVisitMetadataSchema(metadata.Rest, visited, seen)
	}
	for _, alias := range metadata.Aliases {
		if alias.Type != nil {
			visited[alias.Type.Name] = true
			nestiaSDKVisitMetadataSchema(alias.Type.Value, visited, seen)
		}
	}
	for _, array := range metadata.Arrays {
		if array.Type != nil {
			visited[array.Type.Name] = true
			nestiaSDKVisitMetadataSchema(array.Type.Value, visited, seen)
		}
	}
	for _, tuple := range metadata.Tuples {
		if tuple.Type != nil {
			visited[tuple.Type.Name] = true
			for _, elem := range tuple.Type.Elements {
				nestiaSDKVisitMetadataSchema(elem, visited, seen)
			}
		}
	}
	for _, object := range metadata.Objects {
		if object.Type != nil {
			visited[object.Type.Name] = true
			for _, prop := range object.Type.Properties {
				if prop == nil {
					continue
				}
				nestiaSDKVisitMetadataSchema(prop.Key, visited, seen)
				nestiaSDKVisitMetadataSchema(prop.Value, visited, seen)
			}
		}
	}
	for _, set := range metadata.Sets {
		nestiaSDKVisitMetadataSchema(set.Value, visited, seen)
	}
	for _, item := range metadata.Maps {
		nestiaSDKVisitMetadataSchema(item.Key, visited, seen)
		nestiaSDKVisitMetadataSchema(item.Value, visited, seen)
	}
}

func nestiaSDKUnionTypeNames(node *shimast.Node) []string {
	if node == nil {
		return nil
	}
	names := []string{}
	add := func(name string) {
		name = strings.TrimSpace(name)
		if name != "" {
			names = append(names, name)
		}
	}
	add(nestiaSDKTypeNodeText(node))
	if node.Kind == shimast.KindTypeReference {
		add(nestiaSDKEntityNameText(node.AsTypeReferenceNode().TypeName))
	}
	return names
}

func nestiaSDKUnionRank(order map[string]int, name string) int {
	if index, ok := order[name]; ok {
		return index
	}
	return len(order)
}

func nestiaSDKIsTypeGuardError(prog *driver.Program, typ *shimchecker.Type, typeNode *shimast.Node) bool {
	if typeNode != nil {
		name := nestiaSDKTypeNodeText(typeNode)
		if name == "TypeGuardError" || strings.HasPrefix(name, "TypeGuardError<") {
			return true
		}
		if typeNode.Kind == shimast.KindTypeReference {
			ref := typeNode.AsTypeReferenceNode()
			name = nestiaSDKEntityNameText(ref.TypeName)
			if name == "TypeGuardError" {
				return true
			}
		}
	}
	if prog != nil && prog.Checker != nil && typ != nil {
		name := prog.Checker.TypeToString(typ)
		return name == "TypeGuardError" || strings.HasPrefix(name, "TypeGuardError<")
	}
	return false
}

func nestiaSDKTypeGuardErrorSchemaPipe() any {
	// Synthetic metadata for `TypeGuardError` exception responses — does not
	// flow through `nestiaSDKSchemaPipe`, so the pre-baked fields legacy.ts
	// reads (size/name/empty/jsonSchema) have to be filled by hand.
	metadata := nestiaSDKObjectReferenceSchema("TypeGuardErrorany")
	metadata["size"] = 1
	metadata["name"] = "TypeGuardErrorany"
	metadata["empty"] = false
	metadata["jsonSchema"] = map[string]any{
		"version": "3.1",
		"components": map[string]any{
			"schemas": map[string]any{
				"TypeGuardErrorany": map[string]any{
					"type":                 "object",
					"additionalProperties": false,
					"required":             []any{"name", "method", "expected", "value"},
					"properties": map[string]any{
						"name":        map[string]any{"type": "string"},
						"method":      map[string]any{"type": "string"},
						"path":        map[string]any{"type": "string"},
						"expected":    map[string]any{"type": "string"},
						"value":       map[string]any{},
						"description": map[string]any{"type": "string"},
						"message":     map[string]any{"type": "string"},
					},
				},
			},
		},
		"schema": map[string]any{
			"$ref": "#/components/schemas/TypeGuardErrorany",
		},
	}
	return map[string]any{
		"success": true,
		"data": map[string]any{
			"components": map[string]any{
				"aliases": []any{},
				"arrays":  []any{},
				"objects": []any{
					map[string]any{
						"description": nil,
						"index":       0,
						"jsDocTags":   []any{},
						"name":        "TypeGuardErrorany",
						"nullables":   []any{false},
						"recursive":   false,
						"properties": []any{
							nestiaSDKTypeGuardErrorProperty("name", nestiaSDKAtomicSchema("string", true)),
							nestiaSDKTypeGuardErrorProperty("method", nestiaSDKAtomicSchema("string", true)),
							nestiaSDKTypeGuardErrorProperty("path", nestiaSDKAtomicSchema("string", false)),
							nestiaSDKTypeGuardErrorProperty("expected", nestiaSDKAtomicSchema("string", true)),
							nestiaSDKTypeGuardErrorProperty("value", nestiaSDKAnySchema(true)),
							nestiaSDKTypeGuardErrorProperty("description", nestiaSDKAtomicSchema("string", false)),
							nestiaSDKTypeGuardErrorProperty("message", nestiaSDKAtomicSchema("string", false)),
						},
					},
				},
				"tuples": []any{},
			},
			"metadata": metadata,
		},
	}
}

func nestiaSDKTypeGuardErrorProperty(key string, value map[string]any) map[string]any {
	return map[string]any{
		"description": nil,
		"jsDocTags":   []any{},
		"key":         nestiaSDKStringConstantSchema(key),
		"mutability":  nil,
		"value":       value,
	}
}

func nestiaSDKStringConstantSchema(value string) map[string]any {
	schema := nestiaSDKBaseSchema(true)
	schema["constants"] = []any{
		map[string]any{
			"type": "string",
			"values": []any{
				map[string]any{
					"description": nil,
					"jsDocTags":   []any{},
					"tags":        []any{},
					"value":       value,
				},
			},
		},
	}
	return schema
}

func nestiaSDKAtomicSchema(kind string, required bool) map[string]any {
	schema := nestiaSDKBaseSchema(required)
	schema["atomics"] = []any{
		map[string]any{
			"type": kind,
			"tags": []any{},
		},
	}
	return schema
}

func nestiaSDKAnySchema(required bool) map[string]any {
	schema := nestiaSDKBaseSchema(required)
	schema["any"] = true
	return schema
}

func nestiaSDKObjectReferenceSchema(name string) map[string]any {
	schema := nestiaSDKBaseSchema(true)
	schema["objects"] = []any{
		map[string]any{
			"name": name,
			"tags": []any{},
		},
	}
	return schema
}

func nestiaSDKBaseSchema(required bool) map[string]any {
	return map[string]any{
		"aliases":   []any{},
		"any":       false,
		"arrays":    []any{},
		"atomics":   []any{},
		"constants": []any{},
		"escaped":   nil,
		"functions": []any{},
		"maps":      []any{},
		"natives":   []any{},
		"nullable":  false,
		"objects":   []any{},
		"optional":  !required,
		"required":  required,
		"rest":      nil,
		"sets":      []any{},
		"templates": []any{},
		"tuples":    []any{},
	}
}

func nestiaSDKReflectType(
	prog *driver.Program,
	imports []nestiaSDKImportInfo,
	typ *shimchecker.Type,
	typeNode *shimast.Node,
) (map[string]any, []any) {
	if typeNode == nil {
		return map[string]any{"name": "__type"}, []any{}
	}
	if typeNode != nil {
		if ref, refs, ok := nestiaSDKReflectTypeNode(prog, imports, typeNode); ok {
			return ref, refs
		}
	}
	name := ""
	if typeNode != nil {
		name = nestiaSDKTypeNodeText(typeNode)
	}
	if name == "" {
		name = "any"
	}
	if name == "any" && prog != nil && prog.Checker != nil && typ != nil {
		name = prog.Checker.TypeToString(typ)
	}
	return map[string]any{"name": name}, nestiaSDKReflectImports(name, imports)
}

func nestiaSDKReflectTypeNode(
	prog *driver.Program,
	imports []nestiaSDKImportInfo,
	node *shimast.Node,
) (map[string]any, []any, bool) {
	if node == nil {
		return nil, nil, false
	}
	switch node.Kind {
	case shimast.KindIntersectionType:
		ref, refs := nestiaSDKReflectJoinedTypeNode(prog, imports, node.AsIntersectionTypeNode().Types, " & ")
		return ref, refs, true
	case shimast.KindUnionType:
		ref, refs := nestiaSDKReflectJoinedTypeNode(prog, imports, node.AsUnionTypeNode().Types, " | ")
		return ref, refs, true
	case shimast.KindArrayType:
		element, refs, ok := nestiaSDKReflectTypeNode(prog, imports, node.AsArrayTypeNode().ElementType)
		if ok == false {
			element = map[string]any{"name": nestiaSDKTypeNodeText(node.AsArrayTypeNode().ElementType)}
			refs = nestiaSDKReflectImports(element["name"].(string), imports)
		}
		return map[string]any{
			"name":          "Array",
			"typeArguments": []any{element},
		}, refs, true
	case shimast.KindParenthesizedType:
		child, refs, ok := nestiaSDKReflectTypeNode(prog, imports, node.AsParenthesizedTypeNode().Type)
		if ok == false {
			child = map[string]any{"name": nestiaSDKTypeNodeText(node.AsParenthesizedTypeNode().Type)}
			refs = nestiaSDKReflectImports(child["name"].(string), imports)
		}
		name, _ := child["name"].(string)
		return map[string]any{"name": "(" + name + ")"}, refs, true
	case shimast.KindTypeOperator:
		operator := node.AsTypeOperatorNode()
		prefix := nestiaSDKTypeOperatorPrefix(node, operator.Type)
		if prefix == "" {
			return nil, nil, false
		}
		child, refs, ok := nestiaSDKReflectTypeNode(prog, imports, operator.Type)
		if ok == false {
			child = map[string]any{"name": nestiaSDKTypeNodeText(operator.Type)}
			refs = nestiaSDKReflectImports(child["name"].(string), imports)
		}
		name, _ := child["name"].(string)
		return map[string]any{"name": prefix + " " + name}, refs, true
	case shimast.KindTypeQuery:
		return nil, nil, false
	case shimast.KindTypeReference:
		ref := node.AsTypeReferenceNode()
		name := nestiaSDKEntityNameText(ref.TypeName)
		rootRefs := nestiaSDKReflectImports(name, imports)
		if len(rootRefs) == 0 && nestiaSDKIsAsyncReturnWrapper(prog, ref.TypeName, name) == false {
			rootRefs = nestiaSDKReflectTypeReferenceSymbolImport(prog, ref.TypeName, name)
		}
		if ref.TypeArguments != nil && len(ref.TypeArguments.Nodes) != 0 {
			if nestiaSDKIsAsyncReturnWrapper(prog, ref.TypeName, name) && len(ref.TypeArguments.Nodes) == 1 {
				return nestiaSDKReflectTypeNode(prog, imports, ref.TypeArguments.Nodes[0])
			}
			args := make([]any, 0, len(ref.TypeArguments.Nodes))
			groups := [][]any{rootRefs}
			for _, child := range ref.TypeArguments.Nodes {
				arg, refs, ok := nestiaSDKReflectTypeNode(prog, imports, child)
				if ok == false {
					text := nestiaSDKTypeNodeText(child)
					arg = map[string]any{"name": text}
					refs = nestiaSDKReflectImports(text, imports)
				}
				args = append(args, arg)
				groups = append(groups, refs)
			}
			return map[string]any{
				"name":          name,
				"typeArguments": args,
			}, nestiaSDKMergeImportLiterals(groups...), true
		}
		return map[string]any{"name": name}, rootRefs, true
	default:
		name := nestiaSDKTypeNodeText(node)
		if name == "" {
			return nil, nil, false
		}
		return map[string]any{"name": name}, nestiaSDKReflectImports(name, imports), true
	}
}

func nestiaSDKReflectTypeReferenceSymbolImport(prog *driver.Program, node *shimast.Node, name string) []any {
	if prog == nil || prog.Checker == nil || node == nil {
		return nil
	}
	prefix := strings.Split(name, ".")[0]
	if nestiaSDKIsGlobalTypePrefix(prefix) {
		return nil
	}
	symbol := prog.Checker.GetSymbolAtLocation(node)
	if symbol == nil {
		typ := prog.Checker.GetTypeFromTypeNode(node)
		if typ != nil {
			symbol = typ.Symbol()
		}
	}
	if symbol == nil || len(symbol.Declarations) == 0 {
		return nil
	}
	sourceFile := shimast.GetSourceFileOfNode(symbol.Declarations[0])
	if sourceFile == nil {
		return nil
	}
	file := filepath.ToSlash(sourceFile.FileName())
	if strings.Contains(file, "/typescript/lib/") {
		return nil
	}
	return []any{
		map[string]any{
			"file":     file,
			"asterisk": nestiaSDKLiteralNull,
			"default":  nestiaSDKLiteralNull,
			"elements": []string{prefix},
		},
	}
}

func nestiaSDKReflectJoinedTypeNode(
	prog *driver.Program,
	imports []nestiaSDKImportInfo,
	types *shimast.TypeList,
	joiner string,
) (map[string]any, []any) {
	if types == nil {
		return map[string]any{"name": ""}, nil
	}
	names := make([]string, 0, len(types.Nodes))
	groups := [][]any{}
	for _, child := range types.Nodes {
		ref, refs, ok := nestiaSDKReflectTypeNode(prog, imports, child)
		if ok == false {
			text := nestiaSDKTypeNodeText(child)
			names = append(names, text)
			groups = append(groups, nestiaSDKReflectImports(text, imports))
		} else {
			names = append(names, nestiaSDKReflectTypeText(ref))
			groups = append(groups, refs)
		}
	}
	return map[string]any{"name": strings.Join(names, joiner)}, nestiaSDKMergeImportLiterals(groups...)
}

func nestiaSDKReflectTypeText(ref map[string]any) string {
	name, _ := ref["name"].(string)
	args, ok := ref["typeArguments"].([]any)
	if ok == false || len(args) == 0 {
		return name
	}
	texts := make([]string, 0, len(args))
	for _, arg := range args {
		child, ok := arg.(map[string]any)
		if ok == false {
			continue
		}
		texts = append(texts, nestiaSDKReflectTypeText(child))
	}
	return name + "<" + strings.Join(texts, ", ") + ">"
}

func nestiaSDKMergeImportLiterals(groups ...[]any) []any {
	output := []any{}
	seen := map[string]bool{}
	for _, group := range groups {
		for _, item := range group {
			key := fmt.Sprintf("%#v", item)
			if seen[key] {
				continue
			}
			seen[key] = true
			output = append(output, item)
		}
	}
	return output
}

func nestiaSDKTypeOperatorPrefix(node *shimast.Node, operand *shimast.Node) string {
	text := nestiaSDKTypeNodeText(node)
	child := nestiaSDKTypeNodeText(operand)
	prefix := strings.TrimSpace(strings.TrimSuffix(text, child))
	switch prefix {
	case "keyof", "unique", "readonly":
		return prefix
	}
	return ""
}

func nestiaSDKParentClassName(node *shimast.Node) string {
	for parent := node.Parent; parent != nil; parent = parent.Parent {
		if parent.Kind == shimast.KindClassDeclaration {
			if name := parent.Name(); name != nil {
				return name.Text()
			}
		}
	}
	return ""
}

func nestiaSDKMethodName(node *shimast.Node) string {
	if node == nil || node.Name() == nil {
		return ""
	}
	return strings.Trim(node.Name().Text(), "\"'")
}

func nestiaSDKParameterName(node *shimast.Node) string {
	if node == nil || node.Name() == nil {
		return ""
	}
	return strings.Trim(node.Name().Text(), "\"'")
}
func nestiaSDKParameterTypeNode(node *shimast.Node) *shimast.Node {
	if node != nil && node.AsParameterDeclaration() != nil {
		return node.AsParameterDeclaration().Type
	}
	return nil
}
func nestiaSDKMethodReturnTypeNode(prog *driver.Program, method *shimast.Node) *shimast.Node {
	if method != nil && method.FunctionLikeData() != nil {
		if typeNode := method.FunctionLikeData().Type; typeNode != nil {
			return nestiaSDKReturnTypeNode(prog, typeNode)
		}
	}
	return nil
}

func nestiaSDKReturnTypeNode(prog *driver.Program, node *shimast.Node) *shimast.Node {
	if node != nil && node.Kind == shimast.KindTypeReference {
		ref := node.AsTypeReferenceNode()
		if ref != nil && ref.TypeArguments != nil && len(ref.TypeArguments.Nodes) == 1 && nestiaSDKIsAsyncReturnWrapper(prog, ref.TypeName, nestiaSDKEntityNameText(ref.TypeName)) {
			return ref.TypeArguments.Nodes[0]
		}
	}
	return node
}

func nestiaSDKEntityNameText(node *shimast.Node) string {
	return nestiaSDKTypeNodeText(node)
}
func nestiaSDKIsAsyncReturnWrapper(
	prog *driver.Program,
	node *shimast.Node,
	name string,
) bool {
	if name == "Promise" {
		return true
	}
	if name != "Observable" || prog == nil || prog.Checker == nil {
		return false
	}
	symbol := prog.Checker.GetSymbolAtLocation(node)
	return nestiaSDKIsRxjsObservableImport(node) ||
		(symbol != nil && nestiaSDKIsRxjsDeclarations(symbol.Declarations))
}

func nestiaSDKIsRxjsDeclarations(declarations []*shimast.Node) bool {
	for _, decl := range declarations {
		sourceFile := shimast.GetSourceFileOfNode(decl)
		if sourceFile == nil {
			continue
		}
		file := filepath.ToSlash(sourceFile.FileName())
		if strings.Contains(file, "/node_modules/rxjs/") {
			return true
		}
	}
	return false
}

func nestiaSDKIsRxjsObservableImport(node *shimast.Node) bool {
	source, ok := transform.SourceFileText(shimast.GetSourceFileOfNode(node))
	return ok && nestiaSDKHasNamedImport(source, "rxjs", "Observable", "Observable")
}

func nestiaSDKHasNamedImport(
	source string,
	module string,
	imported string,
	local string,
) bool {
	for _, match := range nestiaSDKImportFromPattern.FindAllStringSubmatch(source, -1) {
		if len(match) < 3 || match[2] != module {
			continue
		}
		open := strings.Index(match[1], "{")
		close := strings.LastIndex(match[1], "}")
		if open < 0 || close <= open {
			continue
		}
		for _, part := range strings.Split(match[1][open+1:close], ",") {
			fields := strings.Fields(strings.TrimPrefix(strings.TrimSpace(part), "type "))
			if len(fields) == 1 && fields[0] == local && imported == local {
				return true
			}
			if len(fields) == 3 &&
				fields[0] == imported &&
				fields[1] == "as" &&
				fields[2] == local {
				return true
			}
		}
	}
	return false
}

var nestiaSDKImportFromPattern = regexp.MustCompile(
	`(?s)import\s+(?:type\s+)?(.+?)\s+from\s+["']([^"']+)["']`,
)

func nestiaSDKTypeNodeText(node *shimast.Node) string {
	if node == nil {
		return ""
	}
	file := shimast.GetSourceFileOfNode(node)
	source, ok := transform.SourceFileText(file)
	if ok == false {
		return ""
	}
	start, end := node.Pos(), node.End()
	if start < 0 || end > len(source) || start >= end {
		return ""
	}
	return strings.TrimSpace(source[start:end])
}
type sdkOperationMetadataInsertResult struct {
	text   string
	cursor int
}
func nestiaSDKDiagnostic(site nestiaSDKSite, message string) transform.Diagnostic {
	line, column := 0, 0
	if site.File != nil && site.Method != nil {
		if pos := site.Method.Pos(); pos >= 0 {
			l, c := shimscanner.GetECMALineAndByteOffsetOfPosition(site.File, pos)
			line, column = l+1, c+1
		}
	}
	return transform.Diagnostic{
		File:    site.FilePath,
		Line:    line,
		Column:  column,
		Code:    "nestia.sdk.OperationMetadata",
		Message: message,
	}
}
