package transform

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"runtime/debug"
	"strings"
	"sync"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimchecker "github.com/microsoft/typescript-go/shim/checker"
	shimprinter "github.com/microsoft/typescript-go/shim/printer"
	shimscanner "github.com/microsoft/typescript-go/shim/scanner"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	nativecontext "github.com/samchon/typia/packages/typia/native/core/context"
	nativefactories "github.com/samchon/typia/packages/typia/native/core/factories"
	nativeprogrammers "github.com/samchon/typia/packages/typia/native/core/programmers"
	nativehttp "github.com/samchon/typia/packages/typia/native/core/programmers/http"
	nativejson "github.com/samchon/typia/packages/typia/native/core/programmers/json"
	nativellm "github.com/samchon/typia/packages/typia/native/core/programmers/llm"
	nativeplain "github.com/samchon/typia/packages/typia/native/core/programmers/plain"
	schemametadata "github.com/samchon/typia/packages/typia/native/core/schemas/metadata"
)

type nestiaCoreOptions struct {
	Validate      string
	Stringify     string
	StringifyNull bool
	Llm           bool
	LlmStrict     bool
}

type nestiaCoreSite struct {
	File             *shimast.SourceFile
	FilePath         string
	Call             *shimast.CallExpression
	Modulo           *shimast.Node
	Kind             string
	Type             *shimchecker.Type
	ArgCount         int
	Segments         []string
	Arguments        []string
	ReplaceArguments bool
}

type nestiaCoreTransformState struct {
	prog    *driver.Program
	options nestiaCoreOptions
	// importer is the file-scoped ImportProgrammer shared by every validator
	// generated for the current file on the AST-integration emit path; nil on
	// the legacy text-splice paths, where each generation gets a throwaway
	// importer. When set, generation result caching is disabled: the cache keys
	// on text, but ec-mode nodes embed per-file NewGeneratedNameForNode imports
	// that cannot be reused verbatim across files.
	importer *nativecontext.ImportProgrammer
	// ec is the emit EmitContext on the AST-integration path (nil on the legacy
	// text path). Threaded into ITypiaContext.Emit so typia's per-programmer
	// factories build emit-tracked nodes.
	ec          *shimprinter.EmitContext
	cache       map[nestiaCoreCacheKey][]string
	cacheHits   int
	cacheMisses int
}

type nestiaCoreCacheKey struct {
	Kind          string
	Type          *shimchecker.Type
	TypeName      string
	Modulo        string
	Validate      string
	Stringify     string
	StringifyNull bool
	Llm           bool
	LlmStrict     bool
	ArgCount      int
	AllowOptional bool
}

func newNestiaCoreTransformState(prog *driver.Program, options nestiaCoreOptions) *nestiaCoreTransformState {
	return &nestiaCoreTransformState{
		prog:    prog,
		options: options,
		cache:   map[nestiaCoreCacheKey][]string{},
	}
}

var nestiaCoreFactory = shimast.NewNodeFactory(shimast.NodeFactoryHooks{})

const NestiaCoreKindDecorator = shimast.KindDecorator

type nestiaCoreFileContext struct {
	file        *shimast.SourceFile
	coreImports map[string]string
}

func readNestiaCoreOptions(plan plugin.Plan) nestiaCoreOptions {
	options := nestiaCoreOptions{}
	for _, entry := range plan.Entries {
		if entry.Name != "@nestia/core" && !strings.Contains(entry.Transform, "@nestia/core") {
			continue
		}
		if value, ok := entry.Config["validate"].(string); ok {
			options.Validate = value
		}
		if value, ok := entry.Config["stringify"]; ok {
			if value == nil {
				options.StringifyNull = true
			} else if text, ok := value.(string); ok {
				options.Stringify = text
			}
		}
		if value, ok := entry.Config["llm"]; ok {
			switch v := value.(type) {
			case bool:
				options.Llm = v
			case map[string]any:
				options.Llm = true
				if strict, ok := v["strict"].(bool); ok {
					options.LlmStrict = strict
				}
			}
		}
	}
	return options
}
// nestiaCoreMethodArgumentNode builds the single appended decorator-argument
// node for a method decorator (TypedRoute / TypedQueryRoute). The importer is
// the shared ec-mode ImportProgrammer on the node-emit path; nil on the legacy
// text path.
func nestiaCoreMethodArgumentNode(
	prog *driver.Program,
	importer *nativecontext.ImportProgrammer, ec *shimprinter.EmitContext,
	options nestiaCoreOptions,
	modulo *shimast.Node,
	kind string,
	typ *shimchecker.Type,
) (*shimast.Node, error) {
	return safeNestiaCoreGenerateNode(func() (*shimast.Node, error) {
		switch kind {
		case "TypedQueryRoute":
			return nestiaCoreGenerateTypedQueryRoute(prog, importer, ec, options, modulo, typ), nil
		default:
			return nestiaCoreGenerateTypedRoute(prog, importer, ec, options, modulo, typ), nil
		}
	})
}
func nestiaCoreRawDecoratorCall(decorator *shimast.Node) (*shimast.CallExpression, []string, bool) {
	if decorator == nil || decorator.Kind != NestiaCoreKindDecorator {
		return nil, nil, false
	}
	expression := decorator.AsDecorator().Expression
	if expression == nil || expression.Kind != shimast.KindCallExpression {
		return nil, nil, false
	}
	call := expression.AsCallExpression()
	segments := NestiaCoreExpressionSegments(call.Expression)
	if len(segments) == 0 {
		return nil, nil, false
	}
	return call, segments, true
}

func nestiaCoreDecoratorCall(prog *driver.Program, decorator *shimast.Node) (*shimast.CallExpression, []string, bool) {
	call, segments, ok := nestiaCoreRawDecoratorCall(decorator)
	if !ok {
		return nil, nil, false
	}
	context := newNestiaCoreFileContext(shimast.GetSourceFileOfNode(decorator))
	canonical := nestiaCoreCanonicalSegments(context, segments)
	if nestiaCoreDecoratorReference(prog, context, decorator, segments, canonical) == false {
		return nil, nil, false
	}
	return call, canonical, true
}

func newNestiaCoreFileContext(file *shimast.SourceFile) nestiaCoreFileContext {
	context := nestiaCoreFileContext{
		file:        file,
		coreImports: map[string]string{},
	}
	if file == nil || file.Statements == nil {
		return context
	}
	for _, stmt := range file.Statements.Nodes {
		if stmt == nil || stmt.Kind != shimast.KindImportDeclaration {
			continue
		}
		decl := stmt.AsImportDeclaration()
		if decl == nil || decl.ImportClause == nil || decl.ModuleSpecifier == nil || decl.ModuleSpecifier.Kind != shimast.KindStringLiteral {
			continue
		}
		if decl.ModuleSpecifier.Text() != "@nestia/core" {
			continue
		}
		clause := decl.ImportClause.AsImportClause()
		if clause == nil || clause.PhaseModifier == shimast.KindTypeKeyword {
			continue
		}
		if name := clause.Name(); name != nil {
			context.coreImports[name.Text()] = name.Text()
		}
		if clause.NamedBindings == nil || clause.NamedBindings.Kind != shimast.KindNamedImports {
			continue
		}
		named := clause.NamedBindings.AsNamedImports()
		if named == nil || named.Elements == nil {
			continue
		}
		for _, elem := range named.Elements.Nodes {
			if elem == nil {
				continue
			}
			spec := elem.AsImportSpecifier()
			if spec == nil || spec.IsTypeOnly {
				continue
			}
			name := spec.Name()
			if name != nil {
				imported := name.Text()
				if spec.PropertyName != nil {
					imported = spec.PropertyName.Text()
				}
				context.coreImports[name.Text()] = imported
			}
		}
	}
	return context
}

func nestiaCoreCanonicalSegments(context nestiaCoreFileContext, segments []string) []string {
	if len(segments) == 0 {
		return segments
	}
	imported, ok := context.coreImports[segments[0]]
	if !ok || imported == "" || imported == segments[0] {
		return segments
	}
	canonical := append([]string{}, segments...)
	canonical[0] = imported
	return canonical
}

func nestiaCoreDecoratorReference(
	prog *driver.Program,
	context nestiaCoreFileContext,
	decorator *shimast.Node,
	segments []string,
	canonical []string,
) bool {
	if len(segments) == 0 {
		return false
	}
	if _, ok := context.coreImports[segments[0]]; ok {
		return true
	}
	if nestiaCorePotentialDecoratorSegments(canonical) == false {
		return false
	}
	return IsNestiaCoreCall(prog, decorator.AsDecorator().Expression)
}

func nestiaCorePotentialDecoratorSegments(segments []string) bool {
	return nestiaCoreParameterKind(segments) != "" ||
		nestiaCoreMethodKind(segments) != "" ||
		(len(segments) != 0 && segments[len(segments)-1] == "WebSocketRoute")
}

func IsNestiaCoreCall(prog *driver.Program, node *shimast.Node) bool {
	signature := prog.Checker.GetResolvedSignature(node)
	if signature == nil || signature.Declaration() == nil {
		return false
	}
	source := shimast.GetSourceFileOfNode(signature.Declaration())
	if source == nil {
		return false
	}
	location := filepath.ToSlash(source.FileName())
	return strings.Contains(location, "@nestia/core/lib/") ||
		strings.Contains(location, "packages/core/lib/") ||
		strings.Contains(location, "@nestia/core/src/decorators/") ||
		strings.Contains(location, "packages/core/src/decorators/")
}
func nestiaCoreParameterKind(segments []string) string {
	suffixes := map[string]string{
		"EncryptedBody":         "TypedBody",
		"TypedBody":             "TypedBody",
		"TypedHeaders":          "TypedHeaders",
		"TypedParam":            "TypedParam",
		"TypedQuery":            "TypedQuery",
		"TypedQuery.Body":       "TypedQueryBody",
		"TypedFormData.Body":    "TypedFormDataBody",
		"McpRoute.Params":       "McpRouteParams",
		"PlainBody":             "PlainBody",
		"WebSocketRoute.Header": "TypedBody",
		"WebSocketRoute.Param":  "TypedParam",
		"WebSocketRoute.Query":  "TypedQuery",
	}
	for suffix, kind := range suffixes {
		if nestiaCoreSegmentsHaveSuffix(segments, strings.Split(suffix, ".")) {
			return kind
		}
	}
	return ""
}

func nestiaCoreMethodKind(segments []string) string {
	if len(segments) != 0 && segments[len(segments)-1] == "McpRoute" {
		return "McpRoute"
	}
	if len(segments) < 2 {
		return ""
	}
	methods := map[string]bool{"Get": true, "Post": true, "Patch": true, "Put": true, "Delete": true}
	if methods[segments[len(segments)-1]] == false {
		return ""
	}
	switch segments[len(segments)-2] {
	case "EncryptedRoute", "TypedRoute":
		return "TypedRoute"
	case "TypedQuery":
		return "TypedQueryRoute"
	default:
		return ""
	}
}
// nestiaCoreParameterArgumentNodes builds the appended decorator-argument nodes
// for a parameter decorator. The importer is the file-scoped ImportProgrammer:
// on the node-emit path it is the shared ec-mode importer, so the validator's
// runtime references resolve to tsgo-aliased namespace imports; nil keeps the
// legacy text behavior. Returning nodes (not text) is the single source of truth
// shared by the text path (nestiaCoreParameterArguments) and the AST emit path.
func nestiaCoreParameterArgumentNodes(
	prog *driver.Program,
	importer *nativecontext.ImportProgrammer, ec *shimprinter.EmitContext,
	options nestiaCoreOptions,
	call *shimast.CallExpression,
	modulo *shimast.Node,
	kind string,
	typ *shimchecker.Type,
) ([]*shimast.Node, bool, error) {
	argCount := nestiaCoreArgumentCount(call)
	switch kind {
	case "TypedBody", "TypedHeaders", "TypedQuery", "TypedQueryBody", "McpRouteParams", "PlainBody":
		if argCount != 0 {
			return nil, false, nil
		}
	case "TypedParam":
		if argCount != 1 {
			return nil, false, nil
		}
	case "TypedFormDataBody":
		if argCount > 1 {
			return nil, false, nil
		}
	}
	node, err := safeNestiaCoreGenerateNode(func() (*shimast.Node, error) {
		switch kind {
		case "TypedBody":
			return nestiaCoreGenerateTypedBody(prog, importer, ec, options, modulo, typ), nil
		case "McpRouteParams":
			return nestiaCoreGenerateMcpRouteParams(prog, importer, ec, options, modulo, typ), nil
		case "TypedHeaders":
			return nestiaCoreGenerateTypedHeaders(prog, importer, ec, options, modulo, typ), nil
		case "TypedParam":
			return nestiaCoreGenerateTypedParam(prog, importer, ec, modulo, typ), nil
		case "TypedQuery":
			return nestiaCoreGenerateTypedQuery(prog, importer, ec, options, modulo, typ, true), nil
		case "TypedQueryBody":
			return nestiaCoreGenerateTypedQuery(prog, importer, ec, options, modulo, typ, false), nil
		case "TypedFormDataBody":
			return nestiaCoreGenerateTypedFormDataBody(prog, importer, ec, options, modulo, typ), nil
		case "PlainBody":
			return nestiaCoreGeneratePlainBody(prog, importer, ec, modulo, typ), nil
		default:
			return nil, fmt.Errorf("unsupported parameter decorator %s", kind)
		}
	})
	if err != nil {
		return nil, false, err
	}
	output := []*shimast.Node{}
	if kind == "TypedFormDataBody" && argCount == 0 {
		output = append(output, nestiaCoreFactory.NewKeywordExpression(shimast.KindUndefinedKeyword))
	}
	output = append(output, node)
	// TypedParam takes a third `validate?: boolean` argument (see
	// packages/core/src/decorators/TypedParam.ts). When the configured
	// validate mode starts with "validate", emit `true` so the runtime
	// returns the detailed report shape instead of the single-error shape.
	// The legacy TypedParamProgrammer applied the same conditional.
	if kind == "TypedParam" && strings.HasPrefix(options.Validate, "validate") {
		output = append(output, nestiaCoreFactory.NewKeywordExpression(shimast.KindTrueKeyword))
	}
	return output, true, nil
}

func nestiaCoreGenerateTypedBody(
	prog *driver.Program,
	importer *nativecontext.ImportProgrammer, ec *shimprinter.EmitContext,
	options nestiaCoreOptions,
	modulo *shimast.Node,
	typ *shimchecker.Type,
) *shimast.Node {
	nestiaCoreValidateTypedBody(prog, options, typ)
	context := nestiaCoreTypiaContext(prog, importer, ec, false, false, false)
	name := nestiaCoreTypeName(prog, typ)
	category := options.Validate
	switch category {
	case "assert":
		return nestiaCoreValidatorObject("type", "assert", nativeprogrammers.AssertProgrammer.Write(nativeprogrammers.AssertProgrammer_IProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
			Config: nativeprogrammers.AssertProgrammer_IConfig{Equals: false, Guard: false},
		}), ec)
	case "is":
		return nestiaCoreValidatorObject("type", "is", nativeprogrammers.IsProgrammer.Write(nativeprogrammers.IsProgrammer_IProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
			Config: nativeprogrammers.IsProgrammer_IConfig{Equals: false},
		}), ec)
	case "validateEquals":
		return nestiaCoreValidatorObject("type", "validate", nativeprogrammers.ValidateProgrammer.Write(nativeprogrammers.ValidateProgrammer_IProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
			Config: nativeprogrammers.ValidateProgrammer_IConfig{Equals: true},
		}), ec)
	case "equals":
		return nestiaCoreValidatorObject("type", "is", nativeprogrammers.IsProgrammer.Write(nativeprogrammers.IsProgrammer_IProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
			Config: nativeprogrammers.IsProgrammer_IConfig{Equals: true},
		}), ec)
	case "assertEquals":
		return nestiaCoreValidatorObject("type", "assert", nativeprogrammers.AssertProgrammer.Write(nativeprogrammers.AssertProgrammer_IProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
			Config: nativeprogrammers.AssertProgrammer_IConfig{Equals: true, Guard: false},
		}), ec)
	case "assertClone":
		return nestiaCoreValidatorObject("type", "assert", nativeplain.PlainAssertCloneProgrammer.Write(nativecontext.IProgrammerProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
		}), ec)
	case "validateClone":
		return nestiaCoreValidatorObject("type", "validate", nativeplain.PlainValidateCloneProgrammer.Write(nativecontext.IProgrammerProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
		}), ec)
	case "assertPrune":
		return nestiaCoreValidatorObject("type", "assert", nativeplain.PlainAssertPruneProgrammer.Write(nativecontext.IProgrammerProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
		}), ec)
	case "validatePrune":
		return nestiaCoreValidatorObject("type", "validate", nativeplain.PlainValidatePruneProgrammer.Write(nativecontext.IProgrammerProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
		}), ec)
	default:
		return nestiaCoreValidatorObject("type", "validate", nativeprogrammers.ValidateProgrammer.Write(nativeprogrammers.ValidateProgrammer_IProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
			Config: nativeprogrammers.ValidateProgrammer_IConfig{Equals: false},
		}), ec)
	}
}

// nestiaCoreGenerateTypedHeaders intentionally collapses the 10-mode validate
// option down to {assert, is, validate}. Header values are strings keyed by
// name; deep-clone and prune semantics that @TypedBody honors (assertClone,
// assertPrune, validateClone, validatePrune, etc.) have no meaningful effect
// on a flat string→string map. Pass-through to the base programmer is the
// intended behavior, not a fallthrough — matches v6 parity. See also
// nestiaCoreGenerateTypedQuery and nestiaCoreGenerateTypedFormDataBody.
func nestiaCoreGenerateTypedHeaders(prog *driver.Program, importer *nativecontext.ImportProgrammer, ec *shimprinter.EmitContext, options nestiaCoreOptions, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	context := nestiaCoreTypiaContext(prog, importer, ec, false, false, false)
	name := nestiaCoreTypeName(prog, typ)
	category := options.Validate
	if category == "is" || category == "equals" {
		return nestiaCoreValidatorObject("type", "is", nativehttp.HttpIsHeadersProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}), ec)
	}
	if strings.HasPrefix(category, "validate") {
		return nestiaCoreValidatorObject("type", "validate", nativehttp.HttpValidateHeadersProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}), ec)
	}
	return nestiaCoreValidatorObject("type", "assert", nativehttp.HttpAssertHeadersProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}), ec)
}

func nestiaCoreGenerateTypedParam(prog *driver.Program, importer *nativecontext.ImportProgrammer, ec *shimprinter.EmitContext, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	return nativehttp.HttpParameterProgrammer.Write(nativecontext.IProgrammerProps{
		Context: nestiaCoreTypiaContext(prog, importer, ec, true, false, false),
		Modulo:  modulo,
		Type:    typ,
		Name:    nestiaCoreTypeName(prog, typ),
	})
}

func nestiaCoreGenerateTypedQuery(prog *driver.Program, importer *nativecontext.ImportProgrammer, ec *shimprinter.EmitContext, options nestiaCoreOptions, modulo *shimast.Node, typ *shimchecker.Type, allowOptional bool) *shimast.Node {
	nestiaCoreValidateTypedQuery(prog, options, typ, allowOptional, "@nestia.core.TypedQuery")
	context := nestiaCoreTypiaContext(prog, importer, ec, false, false, false)
	name := nestiaCoreTypeName(prog, typ)
	category := options.Validate
	if category == "is" || category == "equals" {
		return nestiaCoreValidatorObject("type", "is", nativehttp.HttpIsQueryProgrammer.Write(nativehttp.HttpIsQueryProgrammer_IProps{Context: context, Modulo: modulo, Type: typ, Name: name, AllowOptional: allowOptional}), ec)
	}
	if category == "validate" || category == "validateEquals" || category == "validateClone" || category == "validatePrune" {
		return nestiaCoreValidatorObject("type", "validate", nativehttp.HttpValidateQueryProgrammer.Write(nativehttp.HttpValidateQueryProgrammer_IProps{Context: context, Modulo: modulo, Type: typ, Name: name, AllowOptional: allowOptional}), ec)
	}
	return nestiaCoreValidatorObject("type", "assert", nativehttp.HttpAssertQueryProgrammer.Write(nativehttp.HttpAssertQueryProgrammer_IProps{Context: context, Modulo: modulo, Type: typ, Name: name, AllowOptional: allowOptional}), ec)
}

func nestiaCoreGenerateTypedFormDataBody(prog *driver.Program, importer *nativecontext.ImportProgrammer, ec *shimprinter.EmitContext, options nestiaCoreOptions, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	context := nestiaCoreTypiaContext(prog, importer, ec, false, false, false)
	name := nestiaCoreTypeName(prog, typ)
	category := options.Validate
	files := nestiaCoreFormDataFiles(prog, typ)
	validator := nativehttp.HttpAssertFormDataProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name})
	key := "assert"
	if category == "is" || category == "equals" {
		key = "is"
		validator = nativehttp.HttpIsFormDataProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name})
	} else if category == "validate" || category == "validateEquals" || category == "validateClone" || category == "validatePrune" {
		key = "validate"
		validator = nativehttp.HttpValidateFormDataProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name})
	}
	f := nativecontext.EmitFactoryOf(nestiaCoreFactory, ec)
	return f.NewObjectLiteralExpression(f.NewNodeList([]*shimast.Node{
		nestiaCoreProperty("files", nestiaCoreFormDataFilesExpression(files, ec), ec),
		nestiaCoreProperty("validator", nestiaCoreValidatorObject("type", key, validator, ec), ec),
	}), true)
}

type nestiaCoreFormDataFile struct {
	Name  string
	Limit *int
}

func nestiaCoreFormDataFiles(prog *driver.Program, typ *shimchecker.Type) []nestiaCoreFormDataFile {
	collection := schemametadata.NewMetadataCollection()
	result := nativefactories.MetadataFactory.Analyze(nativefactories.MetadataFactory_IProps{
		Checker: prog.Checker,
		Options: nativefactories.MetadataFactory_IOptions{
			Escape:   false,
			Constant: true,
			Absorb:   true,
			Validate: nativehttp.HttpFormDataProgrammer.Validate,
		},
		Components: collection,
		Type:       typ,
	})
	if result.Success == false {
		panic(fmt.Errorf("failed to analyze form-data metadata: %d error(s)", len(result.Errors)))
	}
	files := []nestiaCoreFormDataFile{}
	if result.Data == nil || len(result.Data.Objects) == 0 || result.Data.Objects[0] == nil || result.Data.Objects[0].Type == nil {
		return files
	}
	for _, property := range result.Data.Objects[0].Type.Properties {
		if property == nil || property.Value == nil {
			continue
		}
		direct := nestiaCoreMetadataHasFile(property.Value)
		array := nestiaCoreMetadataArrayHasFile(property.Value)
		if direct == false && array == false {
			continue
		}
		name, ok := nestiaCorePropertyStringKey(property)
		if ok == false {
			continue
		}
		var limit *int
		if direct {
			one := 1
			limit = &one
		}
		files = append(files, nestiaCoreFormDataFile{
			Name:  name,
			Limit: limit,
		})
	}
	return files
}

func nestiaCoreMetadataHasFile(metadata *schemametadata.MetadataSchema) bool {
	if metadata == nil {
		return false
	}
	for _, native := range metadata.Natives {
		if native != nil && (native.Name == "File" || native.Name == "Blob") {
			return true
		}
	}
	return false
}

func nestiaCoreMetadataArrayHasFile(metadata *schemametadata.MetadataSchema) bool {
	if metadata == nil {
		return false
	}
	for _, array := range metadata.Arrays {
		if array == nil || array.Type == nil || array.Type.Value == nil {
			continue
		}
		if nestiaCoreMetadataHasFile(array.Type.Value) {
			return true
		}
	}
	return false
}

func nestiaCorePropertyStringKey(property *schemametadata.MetadataProperty) (string, bool) {
	if property == nil || property.Key == nil {
		return "", false
	}
	for _, constant := range property.Key.Constants {
		if constant == nil || constant.Type != "string" {
			continue
		}
		for _, value := range constant.Values {
			if value == nil {
				continue
			}
			name, ok := value.Value.(string)
			if ok {
				return name, true
			}
		}
	}
	return "", false
}

func nestiaCoreFormDataFilesExpression(files []nestiaCoreFormDataFile, ec *shimprinter.EmitContext) *shimast.Node {
	f := nativecontext.EmitFactoryOf(nestiaCoreFactory, ec)
	elements := make([]*shimast.Node, 0, len(files))
	for _, file := range files {
		limit := f.NewKeywordExpression(shimast.KindNullKeyword)
		if file.Limit != nil {
			limit = nativefactories.LiteralFactory.Write(*file.Limit)
		}
		elements = append(elements, f.NewObjectLiteralExpression(f.NewNodeList([]*shimast.Node{
			nestiaCoreProperty("name", nativefactories.LiteralFactory.Write(file.Name), ec),
			nestiaCoreProperty("limit", limit, ec),
		}), true))
	}
	return f.NewArrayLiteralExpression(f.NewNodeList(elements), true)
}

func nestiaCoreGeneratePlainBody(prog *driver.Program, importer *nativecontext.ImportProgrammer, ec *shimprinter.EmitContext, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	nestiaCoreValidatePlainBody(prog, typ)
	return nativeprogrammers.AssertProgrammer.Write(nativeprogrammers.AssertProgrammer_IProps{
		Context: nestiaCoreTypiaContext(prog, importer, ec, false, false, false),
		Modulo:  modulo,
		Type:    typ,
		Name:    nestiaCoreTypeName(prog, typ),
		Config:  nativeprogrammers.AssertProgrammer_IConfig{Equals: false, Guard: false},
	})
}

func nestiaCoreGenerateTypedRoute(prog *driver.Program, importer *nativecontext.ImportProgrammer, ec *shimprinter.EmitContext, options nestiaCoreOptions, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	nestiaCoreValidateTypedRoute(prog, options, typ)
	if options.StringifyNull {
		return nestiaCoreFactory.NewKeywordExpression(shimast.KindNullKeyword)
	}
	context := nestiaCoreTypiaContext(prog, importer, ec, false, false, false)
	name := nestiaCoreTypeName(prog, typ)
	switch options.Stringify {
	case "is":
		return nestiaCoreValidatorObject("type", "is", nativejson.JsonIsStringifyProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}), ec)
	case "validate":
		return nestiaCoreValidatorObject("type", "validate", nativejson.JsonValidateStringifyProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}), ec)
	case "stringify":
		return nestiaCoreValidatorObject("type", "stringify", nativejson.JsonStringifyProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}), ec)
	case "validate.log":
		return nestiaCoreValidatorObjectWithKey("type", "validate.log", "validate", nativejson.JsonValidateStringifyProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}), ec)
	default:
		return nestiaCoreValidatorObject("type", "assert", nativejson.JsonAssertStringifyProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}), ec)
	}
}

func nestiaCoreGenerateTypedQueryRoute(prog *driver.Program, importer *nativecontext.ImportProgrammer, ec *shimprinter.EmitContext, options nestiaCoreOptions, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	nestiaCoreValidateTypedQueryRoute(prog, options, typ)
	if options.StringifyNull {
		return nestiaCoreFactory.NewKeywordExpression(shimast.KindNullKeyword)
	}
	switch options.Stringify {
	case "is":
		return nestiaCoreValidatorObject("type", "is", nestiaCoreHttpIsQuerifyProgrammer(prog, importer, ec, modulo, typ), ec)
	case "validate":
		return nestiaCoreValidatorObject("type", "validate", nestiaCoreHttpValidateQuerifyProgrammer(prog, importer, ec, modulo, typ), ec)
	case "stringify":
		return nestiaCoreValidatorObject("type", "stringify", nestiaCoreHttpQuerifyProgrammer(prog, ec, typ), ec)
	default:
		return nestiaCoreValidatorObject("type", "assert", nestiaCoreHttpAssertQuerifyProgrammer(prog, importer, ec, modulo, typ), ec)
	}
}

// nestiaCoreTypiaContext builds the typia transform context for a single
// validator generation. The importer argument is the file-scoped ImportProgrammer:
// on the AST-integration emit path it is the shared, ec-mode importer (so every
// generated validator references namespace imports tsgo's module-transform
// aliases, and all injected imports collapse into one ToStatements() set). When
// importer is nil a throwaway importer is allocated, preserving the legacy
// text-splice behavior used by the `transform` / `check` source paths.
func nestiaCoreTypiaContext(prog *driver.Program, importer *nativecontext.ImportProgrammer, ec *shimprinter.EmitContext, numeric bool, finite bool, functional bool) nativecontext.ITypiaContext {
	if importer == nil {
		importer = nativecontext.NewImportProgrammer(nativecontext.ImportProgrammer_IOptions{
			InternalPrefix: "typia_transform_",
			Runtime:        "typia",
		})
	}
	return nativecontext.ITypiaContext{
		Program:         prog,
		CompilerOptions: prog.ParsedConfig.ParsedConfig.CompilerOptions,
		Checker:         prog.Checker,
		Options: nativecontext.ITransformOptions{
			Numeric:    &numeric,
			Finite:     &finite,
			Functional: &functional,
			Runtime:    "typia",
		},
		Importer: importer,
		// Seed the emit context so typia's per-programmer factories
		// (EmitFactoryOf(..., Context.Emit)) build emit-tracked nodes; without it
		// the generated validator/stringifier nodes have no original link and
		// tsgo's MarkLinkedReferences pass nil-panics during emit. nil on the
		// legacy text path.
		Emit: ec,
	}
}

func nestiaCoreStrictMode(prog *driver.Program) bool {
	if prog == nil || prog.ParsedConfig == nil || prog.ParsedConfig.ParsedConfig == nil || prog.ParsedConfig.ParsedConfig.CompilerOptions == nil {
		return true
	}
	options := prog.ParsedConfig.ParsedConfig.CompilerOptions
	return options.GetStrictOptionValue(options.StrictNullChecks)
}

func nestiaCoreLlmConfig(options nestiaCoreOptions) map[string]any {
	return map[string]any{"strict": options.LlmStrict}
}

func nestiaCoreValidateTypedBody(prog *driver.Program, options nestiaCoreOptions, typ *shimchecker.Type) {
	var validate nativefactories.MetadataFactory_Validator
	if options.Llm {
		validate = func(next struct {
			Metadata *schemametadata.MetadataSchema
			Explore  nativefactories.MetadataFactory_IExplore
			Top      *schemametadata.MetadataSchema
		}) []string {
			return nativellm.LlmSchemaProgrammer.Validate(struct {
				Config   map[string]any
				Metadata *schemametadata.MetadataSchema
				Explore  nativefactories.MetadataFactory_IExplore
			}{
				Config:   nestiaCoreLlmConfig(options),
				Metadata: next.Metadata,
				Explore:  next.Explore,
			})
		}
	}
	nativefactories.JsonMetadataFactory.Analyze(nativefactories.JsonMetadataFactory_IProps{
		Method:   "@nestia.core.TypedBody",
		Checker:  prog.Checker,
		Type:     typ,
		Validate: validate,
	})
}

func nestiaCoreValidateTypedRoute(prog *driver.Program, options nestiaCoreOptions, typ *shimchecker.Type) {
	if options.Llm == false {
		return
	}
	nativefactories.JsonMetadataFactory.Analyze(nativefactories.JsonMetadataFactory_IProps{
		Method:  "@nestia.core.TypedRoute",
		Checker: prog.Checker,
		Type:    typ,
		Validate: func(next struct {
			Metadata *schemametadata.MetadataSchema
			Explore  nativefactories.MetadataFactory_IExplore
			Top      *schemametadata.MetadataSchema
		}) []string {
			if next.Metadata == nil || next.Metadata.Size() == 0 {
				return nil
			}
			return nativellm.LlmParametersProgrammer.Validate(struct {
				Config   map[string]any
				Metadata *schemametadata.MetadataSchema
				Explore  nativefactories.MetadataFactory_IExplore
			}{
				Config:   nestiaCoreLlmConfig(options),
				Metadata: next.Metadata,
				Explore:  next.Explore,
			})
		},
	})
}

func nestiaCoreValidateTypedQuery(prog *driver.Program, options nestiaCoreOptions, typ *shimchecker.Type, allowOptional bool, code string) {
	if options.Llm == false {
		return
	}
	collection := schemametadata.NewMetadataCollection()
	result := nativefactories.MetadataFactory.Analyze(nativefactories.MetadataFactory_IProps{
		Checker: prog.Checker,
		Options: nativefactories.MetadataFactory_IOptions{
			Escape:   false,
			Constant: true,
			Absorb:   true,
			Validate: func(next struct {
				Metadata *schemametadata.MetadataSchema
				Explore  nativefactories.MetadataFactory_IExplore
				Top      *schemametadata.MetadataSchema
			}) []string {
				errors := nativehttp.HttpQueryProgrammer.Validate(struct {
					Metadata      *schemametadata.MetadataSchema
					Explore       nativefactories.MetadataFactory_IExplore
					Top           *schemametadata.MetadataSchema
					AllowOptional bool
				}{
					Metadata:      next.Metadata,
					Explore:       next.Explore,
					Top:           next.Top,
					AllowOptional: allowOptional,
				})
				errors = append(errors, nativellm.LlmSchemaProgrammer.Validate(struct {
					Config   map[string]any
					Metadata *schemametadata.MetadataSchema
					Explore  nativefactories.MetadataFactory_IExplore
				}{
					Config:   nestiaCoreLlmConfig(options),
					Metadata: next.Metadata,
					Explore:  next.Explore,
				})...)
				return errors
			},
		},
		Components: collection,
		Type:       typ,
	})
	if result.Success == false {
		panic(nativecontext.TransformerError_from(struct {
			Code   string
			Errors []nativecontext.TransformerError_MetadataFactory_IError
		}{
			Code:   code,
			Errors: nestiaCoreMetadataErrors(result.Errors),
		}))
	}
}

func nestiaCoreValidateTypedQueryRoute(prog *driver.Program, options nestiaCoreOptions, typ *shimchecker.Type) {
	if options.Llm == false {
		return
	}
	collection := schemametadata.NewMetadataCollection()
	result := nativefactories.MetadataFactory.Analyze(nativefactories.MetadataFactory_IProps{
		Checker: prog.Checker,
		Options: nativefactories.MetadataFactory_IOptions{
			Escape:   false,
			Constant: true,
			Absorb:   true,
			Validate: func(next struct {
				Metadata *schemametadata.MetadataSchema
				Explore  nativefactories.MetadataFactory_IExplore
				Top      *schemametadata.MetadataSchema
			}) []string {
				errors := nativehttp.HttpQueryProgrammer.Validate(struct {
					Metadata      *schemametadata.MetadataSchema
					Explore       nativefactories.MetadataFactory_IExplore
					Top           *schemametadata.MetadataSchema
					AllowOptional bool
				}{
					Metadata:      next.Metadata,
					Explore:       next.Explore,
					Top:           next.Top,
					AllowOptional: true,
				})
				if next.Metadata != nil && next.Metadata.Size() != 0 {
					errors = append(errors, nativellm.LlmParametersProgrammer.Validate(struct {
						Config   map[string]any
						Metadata *schemametadata.MetadataSchema
						Explore  nativefactories.MetadataFactory_IExplore
					}{
						Config:   nestiaCoreLlmConfig(options),
						Metadata: next.Metadata,
						Explore:  next.Explore,
					})...)
				}
				return errors
			},
		},
		Components: collection,
		Type:       typ,
	})
	if result.Success == false {
		panic(nativecontext.TransformerError_from(struct {
			Code   string
			Errors []nativecontext.TransformerError_MetadataFactory_IError
		}{
			Code:   "@nestia.core.TypedQueryRoute",
			Errors: nestiaCoreMetadataErrors(result.Errors),
		}))
	}
}

func nestiaCoreValidatePlainBody(prog *driver.Program, typ *shimchecker.Type) {
	collection := schemametadata.NewMetadataCollection()
	result := nativefactories.MetadataFactory.Analyze(nativefactories.MetadataFactory_IProps{
		Checker: prog.Checker,
		Options: nativefactories.MetadataFactory_IOptions{
			Escape:   false,
			Constant: true,
			Absorb:   true,
			Validate: func(next struct {
				Metadata *schemametadata.MetadataSchema
				Explore  nativefactories.MetadataFactory_IExplore
				Top      *schemametadata.MetadataSchema
			}) []string {
				return nestiaCoreValidatePlainBodyMetadata(next.Metadata)
			},
		},
		Components: collection,
		Type:       typ,
	})
	if result.Success == false {
		panic(nativecontext.TransformerError_from(struct {
			Code   string
			Errors []nativecontext.TransformerError_MetadataFactory_IError
		}{
			Code:   "nestia.core.PlainBody",
			Errors: nestiaCoreMetadataErrors(result.Errors),
		}))
	}
}

func nestiaCoreValidatePlainBodyMetadata(metadata *schemametadata.MetadataSchema) []string {
	if metadata == nil {
		return nil
	}
	errors := []string{}
	expected := 0
	for _, atomic := range metadata.Atomics {
		if atomic != nil && atomic.Type == "string" {
			expected = 1
			break
		}
	}
	expected += len(metadata.Templates)
	for _, constant := range metadata.Constants {
		if constant != nil && constant.Type == "string" {
			expected += len(constant.Values)
		}
	}
	if expected == 0 || expected != metadata.Size() {
		errors = append(errors, "only string type is allowed")
	}
	if metadata.Nullable {
		errors = append(errors, "do not allow nullable type")
	} else if metadata.Any {
		errors = append(errors, "do not allow any type")
	}
	return errors
}

func nestiaCoreMetadataErrors(errors []nativefactories.MetadataFactory_IError) []nativecontext.TransformerError_MetadataFactory_IError {
	output := make([]nativecontext.TransformerError_MetadataFactory_IError, 0, len(errors))
	for _, err := range errors {
		output = append(output, nativecontext.TransformerError_MetadataFactory_IError{
			Name: err.Name,
			Explore: nativecontext.TransformerError_MetadataFactory_IExplore{
				Object:    err.Explore.Object,
				Property:  err.Explore.Property,
				Parameter: err.Explore.Parameter,
				Output:    err.Explore.Output,
			},
			Messages: err.Messages,
		})
	}
	return output
}

func nestiaCoreValidatorObject(typeKey string, key string, validator *shimast.Node, ec *shimprinter.EmitContext) *shimast.Node {
	return nestiaCoreValidatorObjectWithKey(typeKey, key, key, validator, ec)
}

func nestiaCoreValidatorObjectWithKey(typeKey string, typeValue string, validatorKey string, validator *shimast.Node, ec *shimprinter.EmitContext) *shimast.Node {
	f := nativecontext.EmitFactoryOf(nestiaCoreFactory, ec)
	return f.NewObjectLiteralExpression(f.NewNodeList([]*shimast.Node{
		nestiaCoreProperty(typeKey, f.NewStringLiteral(typeValue, shimast.TokenFlagsNone), ec),
		nestiaCoreProperty(validatorKey, validator, ec),
	}), true)
}

func nestiaCoreProperty(name string, initializer *shimast.Node, ec *shimprinter.EmitContext) *shimast.Node {
	f := nativecontext.EmitFactoryOf(nestiaCoreFactory, ec)
	return f.NewPropertyAssignment(
		nil,
		nativefactories.IdentifierFactory.Identifier(name),
		nil,
		nil,
		initializer,
	)
}

// safeNestiaCoreGenerateNode runs a validator generator, recovering any panic
// (a typia programmer raises one for user-facing transform errors) into an
// error so the caller can surface a diagnostic instead of crashing the emit.
// It is the node-emit twin of safeNestiaCoreGenerate, which additionally prints
// the node to text for the legacy splice path.
func safeNestiaCoreGenerateNode(generator func() (*shimast.Node, error)) (node *shimast.Node, err error) {
	defer func() {
		if exp := recover(); exp != nil {
			if os.Getenv("NESTIA_NATIVE_DEBUG_STACK") != "" {
				err = fmt.Errorf("%v\n%s", exp, debug.Stack())
			} else {
				err = fmt.Errorf("%v", exp)
			}
		}
	}()
	return generator()
}
var nestiaCoreSingleParameterArrowPattern = regexp.MustCompile(`(^|[\s(=,:?])([A-Za-z_$][A-Za-z0-9_$]*) =>`)

func NestiaCoreMethodReturnType(prog *driver.Program, node *shimast.Node) *shimchecker.Type {
	if typ := nestiaCoreExplicitAsyncReturnType(prog, node); typ != nil {
		return typ
	}
	signature := prog.Checker.GetSignatureFromDeclaration(node)
	if signature == nil {
		return nil
	}
	typ := prog.Checker.GetReturnTypeOfSignature(signature)
	if typ == nil {
		return nil
	}
	symbol := typ.Symbol()
	if symbol != nil &&
		nestiaCoreIsAsyncReturnWrapperSymbol(symbol.Name, symbol.Declarations) {
		args := prog.Checker.GetTypeArguments(typ)
		if len(args) == 1 {
			return args[0]
		}
	}
	return typ
}

func nestiaCoreExplicitAsyncReturnType(prog *driver.Program, node *shimast.Node) *shimchecker.Type {
	if prog == nil || prog.Checker == nil || node == nil || node.FunctionLikeData() == nil {
		return nil
	}
	typeNode := node.FunctionLikeData().Type
	if typeNode == nil || typeNode.Kind != shimast.KindTypeReference {
		return nil
	}
	ref := typeNode.AsTypeReferenceNode()
	if ref == nil || ref.TypeArguments == nil || len(ref.TypeArguments.Nodes) != 1 {
		return nil
	}
	if nestiaCoreIsAsyncReturnWrapperReference(prog, ref.TypeName) == false {
		return nil
	}
	return prog.Checker.GetTypeFromTypeNode(ref.TypeArguments.Nodes[0])
}

func nestiaCoreIsAsyncReturnWrapperReference(
	prog *driver.Program,
	node *shimast.Node,
) bool {
	name := nestiaCoreTypeNodeText(node)
	if name == "Promise" {
		return true
	}
	if name != "Observable" || prog == nil || prog.Checker == nil {
		return false
	}
	symbol := prog.Checker.GetSymbolAtLocation(node)
	return nestiaCoreIsRxjsObservableImport(node) ||
		(symbol != nil && nestiaCoreIsRxjsDeclarations(symbol.Declarations))
}

func nestiaCoreIsAsyncReturnWrapperSymbol(
	name string,
	declarations []*shimast.Node,
) bool {
	if name == "Promise" {
		return true
	}
	return name == "Observable" && nestiaCoreIsRxjsDeclarations(declarations)
}

func nestiaCoreIsRxjsDeclarations(declarations []*shimast.Node) bool {
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

func nestiaCoreIsRxjsObservableImport(node *shimast.Node) bool {
	source, ok := SourceFileText(shimast.GetSourceFileOfNode(node))
	return ok && nestiaCoreHasNamedImport(source, "rxjs", "Observable", "Observable")
}

func nestiaCoreHasNamedImport(
	source string,
	module string,
	imported string,
	local string,
) bool {
	for _, match := range nestiaCoreImportFromPattern.FindAllStringSubmatch(source, -1) {
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

var nestiaCoreImportFromPattern = regexp.MustCompile(
	`(?s)import\s+(?:type\s+)?(.+?)\s+from\s+["']([^"']+)["']`,
)

func nestiaCoreTypeNodeText(node *shimast.Node) string {
	if node == nil {
		return ""
	}
	source, ok := SourceFileText(shimast.GetSourceFileOfNode(node))
	if ok == false {
		return ""
	}
	start, end := node.Pos(), node.End()
	if start < 0 || end > len(source) || start >= end {
		return ""
	}
	return strings.TrimSpace(source[start:end])
}

func nestiaCoreShouldSkipMethodDecorator(prog *driver.Program, call *shimast.CallExpression) bool {
	count := nestiaCoreArgumentCount(call)
	if count >= 2 {
		return true
	}
	if count == 1 {
		last := call.Arguments.Nodes[0]
		if last.Kind == shimast.KindObjectLiteralExpression {
			return true
		}
		if nestiaCoreHasPathLiteralArgument(call) {
			return false
		}
		typ := prog.Checker.GetTypeAtLocation(last)
		if typ != nil && typ.Flags()&shimchecker.TypeFlagsObject != 0 &&
			shimchecker.IsTupleType(typ) == false &&
			shimchecker.Checker_isArrayType(prog.Checker, typ) == false {
			return true
		}
	}
	return false
}

func nestiaCoreHasPathLiteralArgument(call *shimast.CallExpression) bool {
	source, ok := SourceFileText(shimast.GetSourceFileOfNode(call.AsNode()))
	if !ok {
		return false
	}
	open, close, ok := callArgumentBounds(source, call)
	if !ok {
		return false
	}
	text := strings.TrimSpace(source[open+1 : close])
	return strings.HasPrefix(text, `"`) ||
		strings.HasPrefix(text, `'`) ||
		strings.HasPrefix(text, "`") ||
		strings.HasPrefix(text, "[")
}

func nestiaCoreArgumentCount(call *shimast.CallExpression) int {
	if call == nil || call.Arguments == nil {
		return 0
	}
	return len(call.Arguments.Nodes)
}

func callArgumentBounds(source string, call *shimast.CallExpression) (int, int, bool) {
	if call == nil || call.AsNode() == nil || call.Expression == nil {
		return 0, 0, false
	}
	start := call.Expression.End()
	end := call.AsNode().End()
	if start < 0 || end > len(source) || start >= end {
		start = call.AsNode().Pos()
	}
	open := strings.IndexByte(source[start:end], '(')
	if open < 0 {
		return 0, 0, false
	}
	open += start
	close, ok := matchClosingParen(source, open)
	return open, close, ok
}

// matchClosingParen returns the index of the ')' closing the '(' at pos,
// skipping over quoted and template spans so a parenthesis inside a string
// literal argument cannot unbalance the scan.
func matchClosingParen(text string, pos int) (int, bool) {
	if pos >= len(text) || text[pos] != '(' {
		return 0, false
	}
	depth := 1
	for i := pos + 1; i < len(text); i++ {
		switch text[i] {
		case '(':
			depth++
		case ')':
			depth--
			if depth == 0 {
				return i, true
			}
		case '"', '\'', '`':
			q := text[i]
			j := i + 1
			for j < len(text) && text[j] != q {
				if text[j] == '\\' {
					j++
				}
				j++
			}
			i = j
		}
	}
	return 0, false
}
func NestiaCoreExpressionSegments(node *shimast.Node) []string {
	if node == nil {
		return nil
	}
	if node.Kind == shimast.KindIdentifier {
		if id := node.AsIdentifier(); id != nil {
			return []string{id.Text}
		}
	}
	if node.Kind == shimast.KindPropertyAccessExpression {
		access := node.AsPropertyAccessExpression()
		if access == nil {
			return nil
		}
		left := NestiaCoreExpressionSegments(access.Expression)
		name := access.Name()
		if len(left) == 0 || name == nil || name.Kind != shimast.KindIdentifier {
			return nil
		}
		return append(left, name.AsIdentifier().Text)
	}
	return nil
}
func nestiaCoreTypeName(prog *driver.Program, typ *shimchecker.Type) *string {
	name := nestiaCoreTypeNameText(prog, typ)
	return &name
}

type nestiaCoreTypeNameCacheKey struct {
	checker *shimchecker.Checker
	typ     *shimchecker.Type
}

var nestiaCoreTypeNameCache sync.Map

func nestiaCoreTypeNameText(prog *driver.Program, typ *shimchecker.Type) string {
	if prog != nil && prog.Checker != nil && typ != nil {
		key := nestiaCoreTypeNameCacheKey{checker: prog.Checker, typ: typ}
		if cached, ok := nestiaCoreTypeNameCache.Load(key); ok {
			return cached.(string)
		}
		name := prog.Checker.TypeToString(typ)
		nestiaCoreTypeNameCache.Store(key, name)
		return name
	}
	return "any"
}

func nestiaCoreSegmentsHaveSuffix(segments []string, suffix []string) bool {
	if len(suffix) > len(segments) {
		return false
	}
	offset := len(segments) - len(suffix)
	for i, part := range suffix {
		if segments[offset+i] != part {
			return false
		}
	}
	return true
}
type commonJSImportIdentifierSubstitutionsCacheEntry struct {
	value map[string]string
}

var commonJSImportIdentifierSubstitutionsCache sync.Map
func nestiaCoreDiagnostic(site nestiaCoreSite, message string) Diagnostic {
	line, column := 0, 0
	if site.File != nil && site.Call != nil {
		if pos := site.Call.AsNode().Pos(); pos >= 0 {
			l, c := shimscanner.GetECMALineAndByteOffsetOfPosition(site.File, pos)
			line, column = l+1, c+1
		}
	}
	return Diagnostic{
		File:    site.FilePath,
		Line:    line,
		Column:  column,
		Code:    "nestia.core." + site.Kind,
		Message: message,
	}
}

func nestiaCoreGlobalDiagnostic(code string, message string) Diagnostic {
	return Diagnostic{
		Code:    code,
		Message: message,
	}
}
