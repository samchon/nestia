package main

import (
	"fmt"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimchecker "github.com/microsoft/typescript-go/shim/checker"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	nativefactories "github.com/samchon/typia/packages/typia/native/core/factories"
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

type nestiaSDKBuildRewriteSet struct {
	byPath map[string][]nestiaSDKSite
}

func newNestiaSDKBuildRewriteSet() *nestiaSDKBuildRewriteSet {
	return &nestiaSDKBuildRewriteSet{byPath: map[string][]nestiaSDKSite{}}
}

func (rs *nestiaSDKBuildRewriteSet) Add(site nestiaSDKSite) {
	if site.FilePath == "" {
		return
	}
	path := filepath.ToSlash(site.FilePath)
	rs.byPath[path] = append(rs.byPath[path], site)
}

func (rs *nestiaSDKBuildRewriteSet) Len() int {
	if rs == nil {
		return 0
	}
	count := 0
	for _, sites := range rs.byPath {
		count += len(sites)
	}
	return count
}

func (rs *nestiaSDKBuildRewriteSet) Apply(outputName string, text string) (string, error) {
	if rs == nil || len(rs.byPath) == 0 {
		return text, nil
	}
	srcPath, ok := rs.findSourceForOutput(outputName)
	if !ok {
		return text, nil
	}
	out := text
	for _, site := range rs.byPath[srcPath] {
		next, changed := insertSDKOperationMetadataDecorator(out, site)
		if changed {
			out = next
		}
	}
	return injectSDKOperationMetadataImport(out), nil
}

func (rs *nestiaSDKBuildRewriteSet) findSourceForOutput(outputName string) (string, bool) {
	outSlash := strings.TrimSuffix(filepath.ToSlash(outputName), filepath.Ext(outputName))
	for path := range rs.byPath {
		srcStem := strings.TrimSuffix(filepath.ToSlash(path), filepath.Ext(path))
		if outputMatchesSourceStem(outSlash, srcStem) {
			return path, true
		}
	}
	return "", false
}

func collectNestiaSDKSourceRewriteMap(
	prog *driver.Program,
	plan plugin.Plan,
	onlyFile string,
) (map[string][]transformSourceRewrite, []typiaTransformDiagnostic) {
	if plan.SDK == false {
		return map[string][]transformSourceRewrite{}, nil
	}
	sites, diagnostics := collectNestiaSDKSites(prog)
	rewrites := map[string][]transformSourceRewrite{}
	touched := map[string]bool{}
	for _, site := range sites {
		file := filepath.ToSlash(site.FilePath)
		if onlyFile != "" && file != filepath.ToSlash(onlyFile) {
			continue
		}
		source, ok := sourceFileText(site.File)
		if !ok {
			diagnostics = append(diagnostics, nestiaSDKDiagnostic(site, "source text is unavailable"))
			continue
		}
		insert := site.Method.Pos()
		if decorators := site.Method.Decorators(); len(decorators) != 0 {
			insert = decorators[0].Pos()
		}
		indent := sourceLineIndent(source, insert)
		rewrites[file] = append(rewrites[file], transformSourceRewrite{
			start:       insert,
			end:         insert,
			replacement: "\n" + indent + "@__OperationMetadata.OperationMetadata(" + site.Metadata + " as any)\n",
		})
		touched[file] = true
	}
	for file := range touched {
		rewrites[file] = append(rewrites[file], transformSourceRewrite{
			start:       0,
			end:         0,
			replacement: "import * as __OperationMetadata from \"@nestia/sdk\";\n",
		})
	}
	return rewrites, diagnostics
}

func collectNestiaSDKBuildRewrites(
	prog *driver.Program,
	plan plugin.Plan,
) (*nestiaSDKBuildRewriteSet, []typiaTransformDiagnostic) {
	set := newNestiaSDKBuildRewriteSet()
	if plan.SDK == false {
		return set, nil
	}
	sites, diagnostics := collectNestiaSDKSites(prog)
	for _, site := range sites {
		set.Add(site)
	}
	return set, diagnostics
}

func collectNestiaSDKSites(prog *driver.Program) ([]nestiaSDKSite, []typiaTransformDiagnostic) {
	sites := []nestiaSDKSite{}
	diagnostics := []typiaTransformDiagnostic{}
	for _, file := range prog.SourceFiles() {
		if file == nil || file.IsDeclarationFile {
			continue
		}
		file.ForEachChild(func(node *shimast.Node) bool {
			visitNestiaSDKNode(prog, file, node, &sites, &diagnostics)
			return false
		})
	}
	return sites, diagnostics
}

func visitNestiaSDKNode(
	prog *driver.Program,
	file *shimast.SourceFile,
	node *shimast.Node,
	sites *[]nestiaSDKSite,
	diagnostics *[]typiaTransformDiagnostic,
) {
	if node == nil {
		return
	}
	if node.Kind == shimast.KindMethodDeclaration && len(node.Decorators()) != 0 {
		className := nestiaSDKParentClassName(node)
		methodName := nestiaSDKMethodName(node)
		if className != "" && methodName != "" {
			metadata, err := nestiaSDKMetadataText(prog, file, node)
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
	node.ForEachChild(func(child *shimast.Node) bool {
		visitNestiaSDKNode(prog, file, child, sites, diagnostics)
		return false
	})
}

func nestiaSDKMetadataText(prog *driver.Program, file *shimast.SourceFile, method *shimast.Node) (string, error) {
	methodDecl := method.AsMethodDeclaration()
	imports := nestiaSDKAnalyzeImports(file)
	doc := nestiaSDKMethodJSDoc(file, method)
	parameters := []any{}
	if methodDecl.Parameters != nil {
		for index, param := range methodDecl.Parameters.Nodes {
			typ := prog.Checker.GetTypeAtLocation(param)
			name := nestiaSDKParameterName(param)
			response := nestiaSDKResponse(prog, file, imports, typ, nestiaSDKParameterTypeNode(param))
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
	returnType := nestiaCoreMethodReturnType(prog, method)
	returnTypeNode := nestiaSDKMethodReturnTypeNode(method)
	exceptions := nestiaSDKExceptionResponses(prog, file, imports, method)
	metadata := map[string]any{
		"parameters":  parameters,
		"success":     nestiaSDKResponse(prog, file, imports, returnType, returnTypeNode),
		"exceptions":  exceptions,
		"description": nestiaSDKNullableString(doc.Description),
		"jsDocTags":   doc.Tags,
	}
	node := nativefactories.LiteralFactory.Write(metadata)
	text := emitNestiaCoreExpression(prog, file, node, false)
	text = strings.ReplaceAll(text, `"`+nestiaSDKLiteralNull+`"`, "null")
	return text, nil
}

const nestiaSDKLiteralNull = "__NESTIA_LITERAL_NULL__"

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
	source, ok := sourceFileText(file)
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
	prog *driver.Program,
	file *shimast.SourceFile,
	imports []nestiaSDKImportInfo,
	method *shimast.Node,
) []any {
	responses := []any{}
	for _, decorator := range method.Decorators() {
		exception := nestiaSDKTypedExceptionInfo(prog, decorator)
		if exception == nil {
			continue
		}
		responses = append(responses, nestiaSDKResponse(prog, file, imports, exception.Type, exception.Node))
	}
	return responses
}

type nestiaSDKTypedException struct {
	Type *shimchecker.Type
	Node *shimast.Node
}

func nestiaSDKTypedExceptionInfo(prog *driver.Program, decorator *shimast.Node) *nestiaSDKTypedException {
	if decorator == nil || decorator.Kind != nestiaCoreKindDecorator {
		return nil
	}
	expression := decorator.AsDecorator().Expression
	if expression == nil || expression.Kind != shimast.KindCallExpression {
		return nil
	}
	call := expression.AsCallExpression()
	segments := nestiaCoreExpressionSegments(call.Expression)
	if len(segments) == 0 || segments[len(segments)-1] != "TypedException" {
		return nil
	}
	if isNestiaCoreCall(prog, expression) == false {
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
		if clause == nil || clause.PhaseModifier == shimast.KindTypeKeyword {
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
						if spec == nil || spec.IsTypeOnly {
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
	prog *driver.Program,
	file *shimast.SourceFile,
	imports []nestiaSDKImportInfo,
	typ *shimchecker.Type,
	typeNode *shimast.Node,
) map[string]any {
	refType, refImports := nestiaSDKReflectType(prog, imports, typ, typeNode)
	if refImports == nil {
		refImports = []any{}
	}
	return map[string]any{
		"type":      refType,
		"imports":   refImports,
		"primitive": nestiaSDKSchemaPipe(prog, typ, typeNode, true),
		"resolved":  nestiaSDKSchemaPipe(prog, typ, typeNode, false),
	}
}

func nestiaSDKSchemaPipe(prog *driver.Program, typ *shimchecker.Type, typeNode *shimast.Node, escape bool) any {
	if nestiaSDKIsTypeGuardError(prog, typ, typeNode) {
		return nestiaSDKTypeGuardErrorSchemaPipe()
	}
	collection := schemametadata.NewMetadataCollection(
		&schemametadata.MetadataCollection_IOptions{
			Replace: schemametadata.MetadataCollection_replace,
		},
	)
	result := nativefactories.MetadataFactory.Analyze(nativefactories.MetadataFactory_IProps{
		Checker: prog.Checker,
		Options: nativefactories.MetadataFactory_IOptions{
			Escape:   escape,
			Constant: true,
			Absorb:   true,
		},
		Components: collection,
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
		return map[string]any{
			"success": false,
			"errors":  errors,
		}
	}
	nestiaSDKRestoreUnionOrder(typeNode, result.Data)
	return map[string]any{
		"success": true,
		"data": map[string]any{
			"components": nestiaSDKMetadataComponentsLiteral(collection.ToJSON()),
			"metadata":   nestiaSDKMetadataSchemaLiteral(result.Data.ToJSON()),
		},
	}
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
			"metadata": nestiaSDKObjectReferenceSchema("TypeGuardErrorany"),
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
		if len(rootRefs) == 0 && name != "Promise" {
			rootRefs = nestiaSDKReflectTypeReferenceSymbolImport(prog, ref.TypeName, name)
		}
		if ref.TypeArguments != nil && len(ref.TypeArguments.Nodes) != 0 {
			if name == "Promise" && len(ref.TypeArguments.Nodes) == 1 {
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

func nestiaSDKParameterTypeName(prog *driver.Program, node *shimast.Node, typ *shimchecker.Type) string {
	if node != nil && node.AsParameterDeclaration() != nil {
		if typeNode := node.AsParameterDeclaration().Type; typeNode != nil {
			return nestiaSDKTypeNodeText(typeNode)
		}
	}
	return nestiaSDKTypeNameFromChecker(prog, typ)
}

func nestiaSDKParameterTypeNode(node *shimast.Node) *shimast.Node {
	if node != nil && node.AsParameterDeclaration() != nil {
		return node.AsParameterDeclaration().Type
	}
	return nil
}

func nestiaSDKMethodReturnTypeName(prog *driver.Program, method *shimast.Node, typ *shimchecker.Type) string {
	if method != nil && method.FunctionLikeData() != nil {
		if typeNode := method.FunctionLikeData().Type; typeNode != nil {
			return nestiaSDKReturnTypeNodeText(typeNode)
		}
	}
	return nestiaSDKTypeNameFromChecker(prog, typ)
}

func nestiaSDKMethodReturnTypeNode(method *shimast.Node) *shimast.Node {
	if method != nil && method.FunctionLikeData() != nil {
		if typeNode := method.FunctionLikeData().Type; typeNode != nil {
			return nestiaSDKReturnTypeNode(typeNode)
		}
	}
	return nil
}

func nestiaSDKReturnTypeNode(node *shimast.Node) *shimast.Node {
	if node != nil && node.Kind == shimast.KindTypeReference {
		ref := node.AsTypeReferenceNode()
		if ref != nil && ref.TypeArguments != nil && len(ref.TypeArguments.Nodes) == 1 && nestiaSDKEntityNameText(ref.TypeName) == "Promise" {
			return ref.TypeArguments.Nodes[0]
		}
	}
	return node
}

func nestiaSDKEntityNameText(node *shimast.Node) string {
	return nestiaSDKTypeNodeText(node)
}

func nestiaSDKReturnTypeNodeText(node *shimast.Node) string {
	text := nestiaSDKTypeNodeText(node)
	if node != nil && node.Kind == shimast.KindTypeReference {
		ref := node.AsTypeReferenceNode()
		if ref != nil && ref.TypeArguments != nil && len(ref.TypeArguments.Nodes) == 1 && strings.HasPrefix(strings.TrimSpace(text), "Promise<") {
			return nestiaSDKTypeNodeText(ref.TypeArguments.Nodes[0])
		}
	}
	return text
}

func nestiaSDKTypeNodeText(node *shimast.Node) string {
	if node == nil {
		return ""
	}
	file := shimast.GetSourceFileOfNode(node)
	source, ok := sourceFileText(file)
	if ok == false {
		return ""
	}
	start, end := node.Pos(), node.End()
	if start < 0 || end > len(source) || start >= end {
		return ""
	}
	return strings.TrimSpace(source[start:end])
}

func nestiaSDKTypeNameFromChecker(prog *driver.Program, typ *shimchecker.Type) string {
	if prog != nil && prog.Checker != nil && typ != nil {
		return prog.Checker.TypeToString(typ)
	}
	return "any"
}

func insertSDKOperationMetadataDecorator(text string, site nestiaSDKSite) (string, bool) {
	needle := "], " + site.ClassName + ".prototype, \"" + site.MethodName + "\","
	idx := strings.Index(text, needle)
	if idx < 0 {
		return text, false
	}
	head := strings.LastIndex(text[:idx], "__decorate([")
	if head < 0 {
		return text, false
	}
	insert := head + len("__decorate([")
	decorator := "\n    __OperationMetadata.OperationMetadata(" + site.Metadata + "),"
	return text[:insert] + decorator + text[insert:], true
}

func injectSDKOperationMetadataImport(text string) string {
	if strings.Contains(text, "__OperationMetadata.OperationMetadata") == false ||
		strings.Contains(text, "const __OperationMetadata = require(\"@nestia/sdk\")") ||
		strings.Contains(text, "import * as __OperationMetadata from \"@nestia/sdk\"") {
		return text
	}
	esModule := sdkIsESModuleOutput(text)
	var stmt string
	if esModule {
		stmt = "import * as __OperationMetadata from \"@nestia/sdk\";\n"
	} else {
		stmt = "const __OperationMetadata = require(\"@nestia/sdk\");\n"
	}
	index := sdkRuntimeImportInsertionIndex(text, esModule)
	return text[:index] + stmt + text[index:]
}

func sdkIsESModuleOutput(text string) bool {
	return regexp.MustCompile(`(?m)^(import\s|import\{|import\*|export\s)`).MatchString(text)
}

func sdkRuntimeImportInsertionIndex(text string, esModule bool) int {
	index := 0
	if strings.HasPrefix(text, "#!") {
		if next := strings.IndexByte(text, '\n'); next >= 0 {
			index = next + 1
		} else {
			return len(text)
		}
	}
	if esModule {
		return index
	}
	for {
		next := sdkConsumeRuntimeImportPrefix(text[index:])
		if next == 0 {
			return index
		}
		index += next
	}
}

func sdkConsumeRuntimeImportPrefix(text string) int {
	for _, prefix := range []string{
		"\"use strict\";\n",
		"'use strict';\n",
		"/* @ttsc-rewritten */\n",
	} {
		if strings.HasPrefix(text, prefix) {
			return len(prefix)
		}
	}
	return 0
}

func sourceLineIndent(source string, pos int) string {
	if pos < 0 || pos > len(source) {
		return ""
	}
	start := strings.LastIndex(source[:pos], "\n")
	if start < 0 {
		start = 0
	} else {
		start++
	}
	end := start
	for end < len(source) && (source[end] == ' ' || source[end] == '\t') {
		end++
	}
	return source[start:end]
}

func nestiaSDKDiagnostic(site nestiaSDKSite, message string) typiaTransformDiagnostic {
	return typiaTransformDiagnostic{
		File:    site.FilePath,
		Code:    "nestia.sdk.OperationMetadata",
		Message: message,
	}
}
