package sdk

import (
	"encoding"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"sort"
	"strconv"
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
	Type       *shimchecker.Type
	Text       string
	Escape     bool
	Properties bool
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
		visited := map[int]bool{}
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
	visited map[int]bool,
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
			// A method's source position is unique in this file. Class and method
			// names are not: namespaces can legitimately export identically named
			// controller classes and methods.
			key := node.Pos()
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
			response := nestiaSDKResponse(context, imports, typ, nestiaSDKParameterTypeNode(param), true)
			if ref, refs, err := nestiaSDKWebSocketParameterType(context, param); err != nil {
				return "", err
			} else if ref != nil {
				response["type"] = ref
				response["imports"] = refs
			}
			if err := nestiaSDKWebSocketHeaderError(context.prog, param, typ); err != nil {
				return "", err
			}
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
		"success":     nestiaSDKResponse(context, imports, returnType, returnTypeNode, false),
		"exceptions":  exceptions,
		"description": nestiaSDKNullableString(doc.Description),
		"jsDocTags":   doc.Tags,
	}
	return nestiaSDKMetadataLiteralText(metadata)
}

const nestiaSDKLiteralNull = "__NESTIA_LITERAL_NULL__"

func nestiaSDKMetadataLiteralText(metadata map[string]any) (string, error) {
	data, err := json.Marshal(nestiaSDKFiniteLiteral(metadata))
	if err != nil {
		return "", err
	}
	text := string(data)
	text = strings.ReplaceAll(text, `"`+nestiaSDKLiteralNull+`"`, "null")
	return text, nil
}

// nestiaSDKFiniteLiteral copies a metadata value for encoding/json, writing
// every non-finite number as null, the way JavaScript's `JSON.stringify` does.
//
// typia hands over NaN and ±Infinity wherever a type or a comment spells one: a
// numeric literal type such as `1e999`, a type tag argument such as
// `tags.Minimum<1e999>`, and a JSDoc `@x-` extension whose text parses as
// a float, which `NaN`, `Infinity`, and `inf` all do. encoding/json
// refuses those values, so one of them anywhere in the types a route reaches
// used to abort the whole metadata pass. The metadata is marshaled only here,
// so walking it here gives every value, baked schema and metadata literal
// alike, the same rule.
//
// The walk rebuilds maps, slices, and typia's ordered objects, whose
// MarshalJSON would otherwise marshal a non-finite member itself. A null is
// written as typia's explicit `LiteralFactory_Null` marker rather than a Go
// nil, because an ordered object drops a nil member instead of printing it,
// while `JSON.stringify({ a: NaN })` keeps the key. Any other value that
// marshals itself is left as it is.
func nestiaSDKFiniteLiteral(input any) any {
	switch value := input.(type) {
	case nil:
		return nil
	case nativefactories.LiteralFactory_OrderedObject:
		return nestiaSDKFiniteOrderedLiteral(value)
	case *nativefactories.LiteralFactory_OrderedObject:
		if value == nil {
			return value
		}
		return nestiaSDKFiniteOrderedLiteral(*value)
	case json.Marshaler, encoding.TextMarshaler:
		return value
	}
	reflected := reflect.ValueOf(input)
	switch reflected.Kind() {
	case reflect.Float32, reflect.Float64:
		// by kind, because the checker's numbers are typescript-go's named
		// `jsnum.Number`, not a plain float64
		if number := reflected.Float(); math.IsNaN(number) || math.IsInf(number, 0) {
			return nativefactories.LiteralFactory_Null{}
		}
		return input
	case reflect.Map:
		if reflected.IsNil() || reflected.Type().Key().Kind() != reflect.String {
			return input
		}
		output := make(map[string]any, reflected.Len())
		iterator := reflected.MapRange()
		for iterator.Next() {
			output[iterator.Key().String()] = nestiaSDKFiniteLiteral(iterator.Value().Interface())
		}
		return output
	case reflect.Slice, reflect.Array:
		if (reflected.Kind() == reflect.Slice && reflected.IsNil()) || reflected.Type().Elem().Kind() == reflect.Uint8 {
			return input
		}
		output := make([]any, reflected.Len())
		for i := range output {
			output[i] = nestiaSDKFiniteLiteral(reflected.Index(i).Interface())
		}
		return output
	case reflect.Pointer, reflect.Interface:
		if reflected.IsNil() {
			return input
		}
		return nestiaSDKFiniteLiteral(reflected.Elem().Interface())
	}
	return input
}

func nestiaSDKFiniteOrderedLiteral(
	input nativefactories.LiteralFactory_OrderedObject,
) nativefactories.LiteralFactory_OrderedObject {
	output := nativefactories.LiteralFactory_OrderedObject{
		Keys:   input.Keys,
		Values: make(map[string]any, len(input.Values)),
	}
	for key, value := range input.Values {
		output.Values[key] = nestiaSDKFiniteLiteral(value)
	}
	return output
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
	// A tag runs until the next one, and each line loses the comment's margin
	// as TypeScript takes it off: the `*`, then the indentation up to the
	// column the text began at. That is the description's first line, the
	// text after a tag's name, a `@param` description past the parameter's
	// name, a `@returns` one past its type, or, when the tag's text starts on
	// the next line, the tag itself, so an `@example` keeps its code's
	// indentation while a wrapped `@param` description does not.
	description := []string{}
	descriptionMargin := -1
	var tag *nestiaSDKPendingTag
	flush := func() {
		if tag == nil {
			return
		}
		body := strings.TrimLeft(strings.Join(tag.lines, "\n"), "\n")
		body = strings.TrimRight(body, " \t\n")
		if tag.name == "param" {
			param, desc := nestiaSDKParseParamTag(body)
			doc.Tags = append(doc.Tags, nestiaSDKJSDocParamTag(param, desc))
			if param != "" {
				doc.Params[param] = desc
			}
		} else {
			if nestiaSDKIsReturnTag(tag.name) {
				// TypeScript's text leaves out a type the tag declares
				body = strings.TrimLeft(body[nestiaSDKReturnTypeEnd(body):], "\n")
			}
			doc.Tags = append(doc.Tags, nestiaSDKJSDocTag(tag.name, body))
		}
		tag = nil
	}
	for _, line := range strings.Split(comment, "\n") {
		rest := strings.TrimLeft(line, " \t")
		rest = strings.TrimPrefix(rest, "*")
		rest = strings.TrimRight(rest, " \t\r")
		trimmed := strings.TrimSpace(rest)
		if strings.HasPrefix(trimmed, "@") {
			flush()
			name, body := nestiaSDKParseJSDocTag(trimmed)
			margin := nestiaSDKJSDocIndent(rest)
			// where the text begins in the body: a `@param` description after
			// the parameter's name, a `@returns` one after its type
			text := 0
			if name == "param" {
				_, text = nestiaSDKParamTagName(body)
			} else if nestiaSDKIsReturnTag(name) {
				text = nestiaSDKReturnTypeEnd(body)
			}
			if text < len(body) {
				after := trimmed[1+len(name):]
				margin += 1 + len(name) + len(after) - len(strings.TrimLeft(after, " \t")) + text
			}
			tag = &nestiaSDKPendingTag{name: name, lines: []string{body}, margin: margin}
			continue
		}
		if tag != nil {
			tag.lines = append(tag.lines, nestiaSDKJSDocOutdent(rest, tag.margin))
			continue
		}
		if trimmed == "" {
			if len(description) != 0 {
				description = append(description, "")
			}
			continue
		}
		if descriptionMargin == -1 {
			// text on the opening `/**` line has no `*` to measure from, so the
			// lines after it keep the usual `* ` margin
			if strings.HasPrefix(strings.TrimLeft(line, " \t"), "*") {
				descriptionMargin = nestiaSDKJSDocIndent(rest)
			} else {
				descriptionMargin = 1
			}
		}
		description = append(description, nestiaSDKJSDocOutdent(rest, descriptionMargin))
	}
	flush()
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

// nestiaSDKPendingTag is a JSDoc tag whose text may continue on the next
// lines.
type nestiaSDKPendingTag struct {
	name   string
	lines  []string
	margin int
}

// nestiaSDKJSDocIndent counts the spaces and tabs a JSDoc line starts with.
func nestiaSDKJSDocIndent(line string) int {
	return len(line) - len(strings.TrimLeft(line, " \t"))
}

// nestiaSDKJSDocOutdent takes up to margin spaces and tabs off a JSDoc line.
func nestiaSDKJSDocOutdent(line string, margin int) string {
	indent := nestiaSDKJSDocIndent(line)
	if indent > margin {
		indent = margin
	}
	return line[indent:]
}

// nestiaSDKParseParamTag splits a `@param` body into the parameter's name and
// its description, as TypeScript does. A description that starts on the next
// line keeps the indentation its margin leaves it.
func nestiaSDKParseParamTag(body string) (string, string) {
	param, text := nestiaSDKParamTagName(body)
	return param, strings.TrimLeft(body[text:], "\n")
}

// nestiaSDKParamTagName reads the parameter a `@param` body names, as
// TypeScript does: a leading `{Type}` is not the name, and an optional
// parameter's brackets and default, `[name=value]`, are not part of it. It
// also returns where the description begins, past the spaces after the name.
func nestiaSDKParamTagName(body string) (string, int) {
	offset := nestiaSDKSkipBlank(body, 0, true)
	if end := nestiaSDKClosing(body, offset, '{', '}'); end != -1 {
		offset = nestiaSDKSkipBlank(body, end+1, true)
	}
	name := ""
	if end := nestiaSDKClosing(body, offset, '[', ']'); end != -1 {
		// the bracket that closes the first, past any in a default value
		name = body[offset+1 : end]
		if equal := strings.Index(name, "="); equal != -1 {
			name = name[:equal]
		}
		name = strings.TrimSpace(name)
		offset = end + 1
	} else {
		start := offset
		for offset < len(body) && strings.IndexByte(" \t\n", body[offset]) == -1 {
			offset++
		}
		name = body[start:offset]
	}
	return name, nestiaSDKSkipBlank(body, offset, false)
}

// nestiaSDKIsReturnTag tells a `@returns` tag, which TypeScript also reads as
// `@return`.
func nestiaSDKIsReturnTag(name string) bool {
	return name == "returns" || name == "return"
}

// nestiaSDKReturnTypeEnd returns where a `@returns` body's text begins past a
// leading `{Type}`, which TypeScript reads as the type rather than the text,
// and the spaces after it; 0 without a type.
func nestiaSDKReturnTypeEnd(body string) int {
	if end := nestiaSDKClosing(body, nestiaSDKSkipBlank(body, 0, true), '{', '}'); end != -1 {
		return nestiaSDKSkipBlank(body, end+1, false)
	}
	return 0
}

// nestiaSDKClosing finds the bracket closing the one text opens at start, or
// -1 when text opens none there or never closes it.
func nestiaSDKClosing(text string, start int, open byte, close byte) int {
	if start >= len(text) || text[start] != open {
		return -1
	}
	depth := 0
	for i := start; i < len(text); i++ {
		if text[i] == open {
			depth++
		} else if text[i] == close {
			depth--
			if depth == 0 {
				return i
			}
		}
	}
	return -1
}

// nestiaSDKSkipBlank moves offset past spaces and tabs, and line breaks too
// when newline is set.
func nestiaSDKSkipBlank(text string, offset int, newline bool) int {
	for offset < len(text) &&
		(text[offset] == ' ' || text[offset] == '\t' || (newline && text[offset] == '\n')) {
		offset++
	}
	return offset
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

// nestiaSDKJSDocParamTag writes a `@param` tag the way TypeScript's
// `JSDocTagInfo` does, which the SDK generators read: the parameter's name
// as its own `parameterName` part, then a space and the description. Written
// as one text part, the name could not be matched, so a WebSocket route lost
// every `@param` line and the generators' tag fallbacks never applied.
func nestiaSDKJSDocParamTag(param string, desc string) map[string]any {
	if param == "" {
		return nestiaSDKJSDocTag("param", "")
	}
	text := []any{
		map[string]any{
			"text": param,
			"kind": "parameterName",
		},
	}
	if desc != "" {
		text = append(text,
			map[string]any{"text": " ", "kind": "space"},
			map[string]any{"text": desc, "kind": "text"},
		)
	}
	return map[string]any{
		"name": "param",
		"text": text,
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
		responses = append(responses, nestiaSDKResponse(context, imports, exception.Type, exception.Node, false))
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
	Elements []nestiaSDKImportElement
}

type nestiaSDKImportElement struct {
	Local    string
	Imported string
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
			Elements: []nestiaSDKImportElement{},
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
							imported := name.Text()
							if property := spec.PropertyName; property != nil {
								imported = property.Text()
							}
							info.Elements = append(info.Elements, nestiaSDKImportElement{
								Local:    name.Text(),
								Imported: imported,
							})
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
		if prefixes[elem.Local] {
			return true
		}
	}
	return false
}

func nestiaSDKImportLiteral(imp nestiaSDKImportInfo, prefixes map[string]bool) map[string]any {
	elements := []string{}
	aliases := map[string]string{}
	for _, elem := range imp.Elements {
		if prefixes[elem.Local] {
			elements = append(elements, elem.Local)
			if elem.Imported != elem.Local {
				aliases[elem.Local] = elem.Imported
			}
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
	output := map[string]any{
		"file":     imp.File,
		"asterisk": asterisk,
		"default":  def,
		"elements": elements,
	}
	if len(aliases) != 0 {
		output["elementAliases"] = aliases
	}
	return output
}

// nestiaSDKResponse reflects one route input or output. `parameter` marks a
// method parameter: the Swagger generator reads query and headers parameters
// from the resolved schema and may decompose their object into one OpenAPI
// parameter per property, so only that schema bakes the property schemas.
func nestiaSDKResponse(
	context *nestiaSDKContext,
	imports []nestiaSDKImportInfo,
	typ *shimchecker.Type,
	typeNode *shimast.Node,
	parameter bool,
) map[string]any {
	prog := context.prog
	refType, refImports := nestiaSDKReflectType(prog, imports, typ, typeNode)
	if refImports == nil {
		refImports = []any{}
	}
	return map[string]any{
		"type":      refType,
		"imports":   refImports,
		"primitive": nestiaSDKSchemaPipe(context, typ, typeNode, true, false),
		"resolved":  nestiaSDKSchemaPipe(context, typ, typeNode, false, parameter),
	}
}

func nestiaSDKSchemaPipe(context *nestiaSDKContext, typ *shimchecker.Type, typeNode *shimast.Node, escape bool, properties bool) any {
	prog := context.prog
	key := nestiaSDKSchemaCacheKey{
		Type:       typ,
		Text:       nestiaSDKTypeNodeText(typeNode),
		Escape:     escape,
		Properties: properties,
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
	if baked := nestiaSDKTryBakeJsonSchema(prog, typeNode, result.Data, properties); baked != nil {
		metadataLiteral["jsonSchema"] = baked
	}
	data := map[string]any{
		"components": nestiaSDKMetadataComponentsLiteral(nestiaSDKVisitedMetadataComponents(context.collection, result.Data)),
		"metadata":   metadataLiteral,
	}
	if properties {
		// a route parameter's HTTP rule verdicts, from its own analysis
		data["http"] = nestiaSDKHttpRules(prog.Checker, typ)
	}
	value := map[string]any{
		"success": true,
		"data":    data,
	}
	context.schemaCache[key] = value
	return value
}

// nestiaSDKTryBakeJsonSchema runs `JsonSchemasProgrammer.WriteSchemas` for a
// single metadata and returns the OpenAPI 3.1 schema literal. Returns nil
// when typia signals the metadata has no JSON-schema representation (e.g.
// `void` returns, function-only types) — the JS-side reader handles missing
// `jsonSchema` fields. Any other panic is re-raised so real bugs surface.
//
// With `properties`, the literal also carries the schema of each property of
// the metadata's first object type, for the Swagger generator to decompose into
// individual parameters (see `nestiaSDKPropertySchemas`).
func nestiaSDKTryBakeJsonSchema(
	prog *driver.Program,
	typeNode *shimast.Node,
	metadata *schemametadata.MetadataSchema,
	properties bool,
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
	// Baked before the components are flattened: the property schemas share
	// the parent's components, so any component they reach must be included.
	var propertySchemas map[string]any
	if properties && collection.Components != nil {
		propertySchemas = nestiaSDKPropertySchemas(metadata, collection.Components)
	}
	// `iterate.OpenApi_IComponents` has no JSON tags on its Schemas field,
	// so default Go marshaling would emit `"Schemas"` (capital). The JS
	// side reads `components.schemas`, so flatten to a plain map here.
	componentsLiteral := map[string]any{"schemas": map[string]any{}}
	if collection.Components != nil && collection.Components.Schemas != nil {
		schemasLiteral := map[string]any{}
		for key, val := range collection.Components.Schemas {
			schemasLiteral[key] = nestiaSDKJsonSchemaLiteral(val)
		}
		componentsLiteral["schemas"] = schemasLiteral
	}
	baked = map[string]any{
		"version":    collection.Version,
		"components": componentsLiteral,
		"schema":     nestiaSDKJsonSchemaLiteral(collection.Schemas[0]),
	}
	if propertySchemas != nil {
		baked["properties"] = propertySchemas
	}
	nestiaSDKMarkReadonlyArrayJsonSchema(prog, typeNode, baked)
	return baked
}

// nestiaSDKPropertySchemas bakes the schema of each property of the metadata's
// first object type, keyed by property name, for a decomposed query or headers
// parameter. It is the property schema typia's object writer produces, minus
// the fields the OpenAPI parameter carries in its own members: typia merges the
// property's title, description, and deprecation into that schema, plus
// readOnly, which has no meaning for a request parameter. What remains is the
// value schema, written by typia's `Json_schema_station` exactly as
// `WriteSchemas` writes one metadata but against the parent's components, so a
// named type the value reaches resolves to the component the parent already
// carries, and the property's `x-` JSDoc extensions.
//
// Only properties typia's object schema describes are baked: a property must
// have a literal key and no `@hidden`, `@ignore`, or `@internal` tag (the
// filter `json_schema_object` applies), and a value with no JSON form
// (function-only or `never`) yields no schema. Skipping them here also keeps
// their types out of the shared components.
func nestiaSDKPropertySchemas(
	metadata *schemametadata.MetadataSchema,
	components *nativeiterate.OpenApi_IComponents,
) map[string]any {
	if len(metadata.Objects) == 0 || metadata.Objects[0].Type == nil {
		return nil
	}
	output := map[string]any{}
	for _, property := range metadata.Objects[0].Type.Properties {
		if property == nil || property.Key == nil || property.Value == nil {
			continue
		}
		key := property.Key.GetSoleLiteral()
		if key == nil || nestiaSDKHasJSDocTag(property.JsDocTags, "hidden", "ignore", "internal") {
			continue
		}
		schema := nativeiterate.Json_schema_station(nativeiterate.Json_schema_station_props{
			BlockNever: true,
			Components: components,
			Attribute:  nativeiterate.JsonSchema{},
			Metadata:   property.Value,
		})
		if schema == nil {
			continue
		}
		nestiaSDKJsDocExtensions(schema, property.JsDocTags)
		output[*key] = nestiaSDKJsonSchemaLiteral(schema)
	}
	return output
}

// nestiaSDKJsDocExtensions writes a property's `x-` JSDoc tags into its schema
// the way typia's object writer does (`json_schema_jsDocTags`, unexported):
// the first text part, trimmed, read as a boolean, a number, null, or else a
// string.
func nestiaSDKJsDocExtensions(schema nativeiterate.JsonSchema, tags []schemametadata.IJsDocTagInfo) {
	for _, tag := range tags {
		if strings.HasPrefix(tag.Name, "x-") == false {
			continue
		}
		for _, text := range tag.Text {
			if text.Kind != "text" {
				continue
			}
			value := strings.ReplaceAll(strings.TrimSpace(text.Text), "\r\n", "\n")
			if value == "true" || value == "false" {
				schema[tag.Name] = value == "true"
			} else if number, err := strconv.ParseFloat(value, 64); err == nil {
				schema[tag.Name] = number
			} else if value == "null" {
				schema[tag.Name] = nil
			} else {
				schema[tag.Name] = value
			}
			break
		}
	}
}

func nestiaSDKHasJSDocTag(tags []schemametadata.IJsDocTagInfo, names ...string) bool {
	for _, tag := range tags {
		for _, name := range names {
			if tag.Name == name {
				return true
			}
		}
	}
	return false
}

// nestiaSDKJsonSchemaLiteral prepares one typia JSON schema for the
// encoding/json serialization of the SDK metadata, dropping the members typia
// leaves absent.
//
// typia's schema writer stores a Go nil for an absent member: a constant with
// no `@title` gets a nil *string title and description, and `any` gets a nil
// type. typia's own literal printer skips nil object members, but encoding/json
// prints them as null, which JSON Schema rejects for those keywords. A nil
// cannot be dropped everywhere, though: in an instance-valued keyword (`const`,
// `default`, `enum`, `example`, `examples`) or a vendor extension it can be a
// real null. typia marks the nulls a type declares, such as
// `tags.Example<null>`, with `LiteralFactory_Null`, which is no nil and
// marshals as null, but a JSDoc `@x-foo null` still reaches the schema as a
// bare nil, from typia's object writer and from nestiaSDKJsDocExtensions alike.
//
// So the walk follows JSON Schema structure: it drops a nil member of a schema
// object, recurses through the applicator keywords into subschemas, and leaves
// every other value, instance data included, as it is.
func nestiaSDKJsonSchemaLiteral(input any) any {
	reflected := reflect.ValueOf(input)
	if reflected.Kind() != reflect.Map || reflected.Type().Key().Kind() != reflect.String {
		return input // a boolean schema, or a value that is no schema object
	}
	output := make(map[string]any, reflected.Len())
	iterator := reflected.MapRange()
	for iterator.Next() {
		key := iterator.Key().String()
		member := iterator.Value().Interface()
		if nestiaSDKJsonSchemaInstanceKeyword(key) {
			output[key] = member
		} else if nestiaSDKIsNilLike(member) == false {
			output[key] = nestiaSDKJsonSchemaMember(key, member)
		}
	}
	return output
}

// nestiaSDKJsonSchemaMember recurses into the subschemas a JSON Schema 2020-12
// applicator keyword holds, and returns any other keyword value unchanged.
func nestiaSDKJsonSchemaMember(key string, member any) any {
	switch key {
	case "items", "additionalItems", "additionalProperties", "unevaluatedItems",
		"unevaluatedProperties", "contains", "propertyNames", "not", "if", "then",
		"else", "contentSchema":
		return nestiaSDKJsonSchemaLiteral(member)
	case "allOf", "anyOf", "oneOf", "prefixItems":
		reflected := reflect.ValueOf(member)
		if reflected.Kind() != reflect.Slice && reflected.Kind() != reflect.Array {
			return member
		}
		output := make([]any, reflected.Len())
		for i := range output {
			output[i] = nestiaSDKJsonSchemaLiteral(reflected.Index(i).Interface())
		}
		return output
	case "properties", "patternProperties", "dependentSchemas", "$defs", "definitions":
		return nestiaSDKJsonSchemaNamedLiteral(member)
	}
	return member
}

// nestiaSDKJsonSchemaNamedLiteral normalizes each schema of a name-keyed schema
// map, such as `properties`, keeping the order of typia's ordered objects.
func nestiaSDKJsonSchemaNamedLiteral(input any) any {
	switch value := input.(type) {
	case nativefactories.LiteralFactory_OrderedObject:
		return nestiaSDKJsonSchemaOrderedLiteral(value)
	case *nativefactories.LiteralFactory_OrderedObject:
		if value == nil {
			return nil
		}
		return nestiaSDKJsonSchemaOrderedLiteral(*value)
	}
	reflected := reflect.ValueOf(input)
	if reflected.Kind() != reflect.Map || reflected.Type().Key().Kind() != reflect.String {
		return input
	}
	output := make(map[string]any, reflected.Len())
	iterator := reflected.MapRange()
	for iterator.Next() {
		output[iterator.Key().String()] = nestiaSDKJsonSchemaLiteral(iterator.Value().Interface())
	}
	return output
}

func nestiaSDKJsonSchemaOrderedLiteral(
	input nativefactories.LiteralFactory_OrderedObject,
) nativefactories.LiteralFactory_OrderedObject {
	output := nativefactories.LiteralFactory_OrderedObject{
		Keys:   make([]string, 0, len(input.Keys)),
		Values: make(map[string]any, len(input.Keys)),
	}
	for _, key := range input.Keys {
		value, ok := input.Values[key]
		if ok == false || nestiaSDKIsNilLike(value) {
			continue
		}
		output.Keys = append(output.Keys, key)
		output.Values[key] = nestiaSDKJsonSchemaLiteral(value)
	}
	return output
}

// nestiaSDKJsonSchemaInstanceKeyword reports a keyword whose value is JSON
// instance data, where null is a legitimate value: the instance keywords of
// JSON Schema and OpenAPI, and `x-` vendor extensions.
func nestiaSDKJsonSchemaInstanceKeyword(key string) bool {
	switch key {
	case "const", "default", "enum", "example", "examples":
		return true
	}
	return strings.HasPrefix(key, "x-")
}

// nestiaSDKIsNilLike mirrors typia's `literalFactory_isNilLike`.
func nestiaSDKIsNilLike(value any) bool {
	if value == nil {
		return true
	}
	reflected := reflect.ValueOf(value)
	switch reflected.Kind() {
	case reflect.Chan, reflect.Func, reflect.Interface, reflect.Map, reflect.Pointer, reflect.Slice:
		return reflected.IsNil()
	default:
		return false
	}
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
	if prog == nil || prog.Checker == nil {
		return false
	}
	var symbol *shimast.Symbol
	if typeNode != nil && typeNode.Kind == shimast.KindTypeReference {
		ref := typeNode.AsTypeReferenceNode()
		symbol = prog.Checker.GetSymbolAtLocation(ref.TypeName)
	}
	if symbol == nil && typ != nil {
		symbol = typ.Symbol()
	}
	if symbol == nil {
		return false
	}
	if symbol.Flags&shimast.SymbolFlagsAlias != 0 {
		if aliased := shimchecker.Checker_getAliasedSymbol(prog.Checker, symbol); aliased != nil {
			symbol = aliased
		}
	}
	if symbol.Name != "TypeGuardError" {
		return false
	}
	for _, declaration := range symbol.Declarations {
		source := shimast.GetSourceFileOfNode(declaration)
		if source == nil {
			continue
		}
		if nestiaSDKIsTypiaSourceFile(prog, source) {
			return true
		}
	}
	return false
}

func nestiaSDKIsTypiaSourceFile(prog *driver.Program, source *shimast.SourceFile) bool {
	if prog == nil || prog.FS == nil || source == nil {
		return false
	}
	for directory := filepath.Dir(source.FileName()); ; {
		contents, ok := prog.FS.ReadFile(filepath.Join(directory, "package.json"))
		if ok {
			var pack struct {
				Name string `json:"name"`
			}
			return json.Unmarshal([]byte(contents), &pack) == nil && pack.Name == "typia"
		}
		parent := filepath.Dir(directory)
		if parent == directory {
			return false
		}
		directory = parent
	}
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

// nestiaSDKMethodName names a decorated method's site. The contributor visits
// every decorated method of the program, controller or not, and a computed
// name such as `[key]` has no identifier: it reads as its literal key when it
// has one, and as its source otherwise. The metadata still reaches the method,
// because a decorator attaches it under the key the runtime computes.
func nestiaSDKMethodName(node *shimast.Node) string {
	if node == nil || node.Name() == nil {
		return ""
	}
	name := node.Name()
	if name.Kind == shimast.KindComputedPropertyName {
		switch expression := name.AsComputedPropertyName().Expression; expression.Kind {
		case shimast.KindStringLiteral, shimast.KindNumericLiteral, shimast.KindNoSubstitutionTemplateLiteral:
			return expression.Text()
		}
	}
	return strings.Trim(shimast.NodeText(name), "\"'")
}

// nestiaSDKWebSocketHeaderError reports a WebSocket route whose handshake
// header the generated SDK cannot carry: the header type of an
// @WebSocketRoute.Acceptor() (its first type argument) or the type of an
// @WebSocketRoute.Header() parameter must be an object type or undefined,
// because the SDK function sends it as connection.headers, which @nestia/fetcher
// types `IConnection<Headers extends object | undefined>`. tgrid itself leaves
// the header unconstrained, so a null or primitive header serves, yet its SDK
// would not compile.
func nestiaSDKWebSocketHeaderError(
	prog *driver.Program,
	param *shimast.Node,
	typ *shimchecker.Type,
) error {
	category := transform.NestiaCoreWebSocketParameterCategory(prog, param)
	var header *shimchecker.Type
	switch category {
	case "Acceptor":
		// only tgrid's acceptor has a header; the transform already rejects any
		// other type, and asking a non-reference type for its type arguments
		// would fault the checker
		if _, name := transform.NestiaCoreWebSocketTypeReference(prog, nestiaSDKParameterTypeNode(param)); name != "WebSocketAcceptor" {
			return nil
		}
		if typ == nil || typ.Flags()&shimchecker.TypeFlagsObject == 0 || typ.ObjectFlags()&shimchecker.ObjectFlagsReference == 0 {
			return nil
		}
		if args := shimchecker.Checker_getTypeArguments(prog.Checker, typ); len(args) != 0 {
			header = args[0]
		}
	case "Header":
		header = typ
	default:
		return nil
	}
	if header == nil || nestiaSDKIsConnectionHeader(header) {
		return nil
	}
	return fmt.Errorf(
		"@WebSocketRoute.%s() parameter %q has the header type %q, which the SDK cannot send: it carries the handshake header as connection.headers, which must be an object type or undefined. Use an object type, or undefined for no header.",
		category,
		nestiaSDKParameterName(param),
		prog.Checker.TypeToString(header),
	)
}

// nestiaSDKIsConnectionHeader reports whether typ is assignable to
// `object | undefined`, the constraint of IConnection's Headers: any, never,
// undefined, an object type, or a union of them; an intersection only when
// every member is an object type, so `string & {}` stays a string.
func nestiaSDKIsConnectionHeader(typ *shimchecker.Type) bool {
	flags := typ.Flags()
	if flags&(shimchecker.TypeFlagsAny|shimchecker.TypeFlagsNever|shimchecker.TypeFlagsUndefined|shimchecker.TypeFlagsObject|shimchecker.TypeFlagsNonPrimitive) != 0 {
		return true
	}
	if flags&shimchecker.TypeFlagsUnion != 0 {
		for _, elem := range typ.AsUnionOrIntersectionType().Types() {
			if nestiaSDKIsConnectionHeader(elem) == false {
				return false
			}
		}
		return true
	}
	if flags&shimchecker.TypeFlagsIntersection != 0 {
		for _, elem := range typ.AsUnionOrIntersectionType().Types() {
			if elem.Flags()&(shimchecker.TypeFlagsObject|shimchecker.TypeFlagsNonPrimitive) == 0 {
				return false
			}
		}
		return true
	}
	return false
}

// nestiaSDKWebSocketParameterType reflects an @WebSocketRoute.Acceptor() or
// .Driver() parameter annotated through a type alias or an import type as the
// tgrid reference it spells, such as `WebSocketAcceptor<Header, Provider,
// Listener>`, because the generated client needs those type arguments. Each
// argument is reflected in the file that writes it, and one naming a type
// parameter of a generic alias is replaced by what the annotation passes for
// it. It returns nil for an annotation writing the tgrid reference itself as a
// type reference, and an error for an alias using its type parameter inside an
// argument, such as `IRoom<P>`, which no written node spells.
func nestiaSDKWebSocketParameterType(
	context *nestiaSDKContext,
	param *shimast.Node,
) (map[string]any, []any, error) {
	category := transform.NestiaCoreWebSocketParameterCategory(context.prog, param)
	switch category {
	case "Acceptor", "Driver":
	default:
		return nil, nil, nil
	}
	chain, name := transform.NestiaCoreWebSocketTypeReference(context.prog, nestiaSDKParameterTypeNode(param))
	// the annotation's own reflection serves a tgrid reference written as a
	// plain type reference, but reflects an import type without its arguments
	if len(chain) == 0 || (len(chain) == 1 && chain[0].Kind == shimast.KindTypeReference) {
		return nil, nil, nil
	}
	args := []any{}
	groups := [][]any{}
	if target := chain[len(chain)-1].TypeArgumentList(); target != nil {
		for _, node := range target.Nodes {
			argument := nestiaSDKWebSocketTypeArgument(context.prog, chain, node)
			if argument == nil {
				return nil, nil, fmt.Errorf(
					"@WebSocketRoute.%s() parameter %q is typed by a type alias whose %s type argument %q uses a type parameter of the alias inside it, which the SDK cannot write. Pass each type parameter as a whole type argument, or write the %s type directly.",
					category,
					nestiaSDKParameterName(param),
					name,
					nestiaSDKTypeNodeText(node),
					name,
				)
			}
			imports := context.imports(shimast.GetSourceFileOfNode(argument))
			arg, refs, ok := nestiaSDKReflectTypeNode(context.prog, imports, argument)
			if ok == false {
				text := nestiaSDKTypeNodeText(argument)
				arg = map[string]any{"name": text}
				refs = nestiaSDKReflectImports(text, imports)
			}
			args = append(args, arg)
			groups = append(groups, refs)
		}
	}
	refs := nestiaSDKMergeImportLiterals(groups...)
	if refs == nil {
		refs = []any{}
	}
	return map[string]any{
		"name":          name,
		"typeArguments": args,
	}, refs, nil
}

// nestiaSDKWebSocketTypeArgument follows a type argument of the last reference
// in chain back through the aliases while it names a type parameter of the
// alias it is written in, to what the reference before passes for it or else
// to the parameter's default. It returns nil when the argument uses such a
// type parameter any other way, which no written node spells.
func nestiaSDKWebSocketTypeArgument(prog *driver.Program, chain []*shimast.Node, node *shimast.Node) *shimast.Node {
	for level := len(chain) - 1; level > 0; {
		alias := nestiaSDKEnclosingTypeAlias(chain[level])
		if alias == nil {
			return nil
		}
		parameters := alias.AsTypeAliasDeclaration().TypeParameters
		index := nestiaSDKTypeParameterIndex(prog, parameters, node)
		if index == -1 {
			if nestiaSDKUsesAliasTypeParameter(prog, node) {
				return nil
			}
			return node
		}
		// the reference naming the alias, a type reference or an import type
		reference := chain[level-1].TypeArgumentList()
		if reference != nil && index < len(reference.Nodes) {
			node = reference.Nodes[index]
			level--
			continue
		}
		// a default may name an earlier parameter of the same alias
		node = parameters.Nodes[index].AsTypeParameterDeclaration().DefaultType
		if node == nil {
			return nil
		}
	}
	return node
}

func nestiaSDKEnclosingTypeAlias(node *shimast.Node) *shimast.Node {
	for parent := node.Parent; parent != nil; parent = parent.Parent {
		if parent.Kind == shimast.KindTypeAliasDeclaration {
			return parent
		}
	}
	return nil
}

// nestiaSDKTypeParameterIndex is the position of the type parameter node names
// by itself, such as `P` or `(P)`, among parameters, or -1.
func nestiaSDKTypeParameterIndex(prog *driver.Program, parameters *shimast.NodeList, node *shimast.Node) int {
	for node != nil && node.Kind == shimast.KindParenthesizedType {
		node = node.AsParenthesizedTypeNode().Type
	}
	if parameters == nil || node == nil || node.Kind != shimast.KindTypeReference {
		return -1
	}
	if arguments := node.AsTypeReferenceNode().TypeArguments; arguments != nil && len(arguments.Nodes) != 0 {
		return -1
	}
	symbol := prog.Checker.GetSymbolAtLocation(node.AsTypeReferenceNode().TypeName)
	if symbol == nil || symbol.Flags&shimast.SymbolFlagsTypeParameter == 0 {
		return -1
	}
	for index, parameter := range parameters.Nodes {
		for _, declaration := range symbol.Declarations {
			if declaration == parameter {
				return index
			}
		}
	}
	return -1
}

// nestiaSDKUsesAliasTypeParameter reports whether node refers to a type
// parameter a type alias declares anywhere inside it.
func nestiaSDKUsesAliasTypeParameter(prog *driver.Program, node *shimast.Node) bool {
	if node == nil {
		return false
	}
	if node.Kind == shimast.KindTypeReference {
		symbol := prog.Checker.GetSymbolAtLocation(node.AsTypeReferenceNode().TypeName)
		if symbol != nil && symbol.Flags&shimast.SymbolFlagsTypeParameter != 0 {
			for _, declaration := range symbol.Declarations {
				if declaration != nil && declaration.Parent != nil && declaration.Parent.Kind == shimast.KindTypeAliasDeclaration {
					return true
				}
			}
		}
	}
	found := false
	node.ForEachChild(func(child *shimast.Node) bool {
		found = nestiaSDKUsesAliasTypeParameter(prog, child)
		return found
	})
	return found
}

// nestiaSDKParameterName reads a parameter's identifier, or "" for a
// destructuring pattern such as `{ organizationId }`, which declares no name
// the SDK could reuse; the SDK names such a parameter after its role.
func nestiaSDKParameterName(node *shimast.Node) string {
	if node == nil || node.Name() == nil || node.Name().Kind != shimast.KindIdentifier {
		return ""
	}
	return node.Name().Text()
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
