package transform

import (
	"fmt"
	"os"
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
	// generated for the current file. When set, generation result caching is
	// disabled: the cache keys on text, but ec-mode nodes embed per-file
	// NewGeneratedNameForNode imports that cannot be reused verbatim across
	// files. The nil case is defensive — every current caller supplies one.
	importer *nativecontext.ImportProgrammer
	// ec is the emit EmitContext. Threaded into ITypiaContext.Emit so typia's
	// per-programmer factories build emit-tracked nodes.
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

// The values the validate and stringify options accept.
var (
	nestiaCoreValidateModes = []string{
		"assert", "is", "validate", "equals",
		"assertEquals", "validateEquals",
		"assertClone", "validateClone",
		"assertPrune", "validatePrune",
	}
	nestiaCoreStringifyModes = []string{"stringify", "assert", "is", "validate", "validate.log"}
)

// nestiaCoreOptionErrors reports each validate or stringify option value that
// is no mode: a generator would otherwise take its default branch, and a typo
// such as "assertEqual" silently weakens validation.
func nestiaCoreOptionErrors(plan plugin.Plan) []string {
	errors := []string{}
	check := func(name string, value any, modes []string, nullable bool) {
		if value == nil && nullable {
			return
		}
		if text, ok := value.(string); ok {
			for _, mode := range modes {
				if mode == text {
					return
				}
			}
		}
		accepted := "\"" + strings.Join(modes, "\", \"") + "\""
		if nullable {
			accepted += ", or null"
		}
		errors = append(errors, fmt.Sprintf("invalid %q option %s: it must be one of %s.", name, nestiaCoreOptionText(value), accepted))
	}
	for _, entry := range plan.Entries {
		if entry.Kind() != "core" {
			continue
		}
		if value, ok := entry.Config["validate"]; ok {
			check("validate", value, nestiaCoreValidateModes, false)
		}
		if value, ok := entry.Config["stringify"]; ok {
			check("stringify", value, nestiaCoreStringifyModes, true)
		}
	}
	return errors
}

func nestiaCoreOptionText(value any) string {
	if text, ok := value.(string); ok {
		return fmt.Sprintf("%q", text)
	}
	return fmt.Sprintf("%v", value)
}

func readNestiaCoreOptions(plan plugin.Plan) nestiaCoreOptions {
	options := nestiaCoreOptions{}
	for _, entry := range plan.Entries {
		if entry.Kind() != "core" {
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
// the file-scoped ec-mode ImportProgrammer.
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
	if IsNestiaCoreCall(prog, call.AsNode()) == false {
		return nil, nil, false
	}
	return call, canonical, true
}

// NestiaCoreCanonicalDecoratorSegments names a decorator call's callee by the
// @nestia/core export its import binds, so `import { TypedException as TE }`
// reads `TE<T>()` as `TypedException`. It returns nil for a decorator that is
// no call.
//
// This mapping names the imported syntax. IsNestiaCoreCall separately verifies
// that the resolved declaration belongs to core, including re-export facades.
//
// @evidence contracts/common.md#principled-implementation The decorator's callee is split into identifier segments, and the leading identifier is replaced by the `@nestia/core` export that its import binds, so an aliased import reads as the canonical name; a decorator that is not a call reads as nil.
// @evidence contracts/common.md#clear-and-simple-design A thin exported wrapper that builds the file's import context and delegates the mapping to a private function.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The names come from the import declarations of the file, and no alias or file name is special-cased.
// @evidence contracts/common.md#meaningful-documentation The comment gives the aliasing example and the nil result.
func NestiaCoreCanonicalDecoratorSegments(decorator *shimast.Node) []string {
	_, segments, ok := nestiaCoreRawDecoratorCall(decorator)
	if !ok {
		return nil
	}
	context := newNestiaCoreFileContext(shimast.GetSourceFileOfNode(decorator))
	return nestiaCoreCanonicalSegments(context, segments)
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

// IsNestiaCoreCall reports whether the call resolves to a declaration in `@nestia/core`.
//
// The resolved signature's declaration belongs to core only when its nearest
// package manifest names @nestia/core, including relocated or re-exported core
// declarations and excluding foreign nested packages.
//
// @evidence contracts/common.md#principled-implementation The resolved signature identifies the actual declaration source, and SourceFilePackageName establishes its nearest owner; unresolved calls or non-core ownership return false without relying on lexical aliases or directory spelling.
// @evidence contracts/common.md#clear-and-simple-design Signature/source nil guards precede one shared package-ownership operation and an exact name comparison.
// @evidence contracts/common.md#prohibited-implementation-shortcuts Foreign workspace lookalikes and nested packages cannot inherit core identity from their path, while a relocated or transparently re-exported core declaration keeps its actual manifest owner.
// @evidence contracts/common.md#meaningful-documentation The comment defines resolved declaration ownership and describes relocation, re-export and nested-package behavior.
func IsNestiaCoreCall(prog *driver.Program, node *shimast.Node) bool {
	if prog == nil || prog.Checker == nil || node == nil {
		return false
	}
	signature := prog.Checker.GetResolvedSignature(node)
	if signature == nil || signature.Declaration() == nil {
		return false
	}
	source := shimast.GetSourceFileOfNode(signature.Declaration())
	if source == nil {
		return false
	}
	return SourceFilePackageName(prog, source) == "@nestia/core"
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
// it is the shared ec-mode importer, so the validator's runtime references
// resolve to tsgo-aliased namespace imports.
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

// nestiaCoreGenerateTypedBody preserves the selected helper's validation,
// equality, clone or prune operation within the public three-tag validator ABI.
// The helper's return value is not the decorator's returned body: the runtime
// validate_request_body consumes each descriptor's success verdict and
// discards clone/data returns, while TypedBody returns the parsed request.body.
// A prune helper can still mutate that input in place before it is returned.
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

// nestiaCoreGenerateTypedHeaders maps all ten validate options onto the HTTP
// header decoder's three base validator families: assert, is and validate.
// Equality, clone and prune options select their corresponding base family;
// this operation generates decoded header values rather than a plain body helper.
// Body helper return semantics and the decorator's returned body are distinct:
// see nestiaCoreGenerateTypedBody for clone results and in-place pruning.
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
		panic(nativecontext.TransformerError_from(struct {
			Code   string
			Errors []nativecontext.TransformerError_MetadataFactory_IError
		}{
			Code:   "nestia.core.TypedFormDataBody",
			Errors: nestiaCoreMetadataErrors(result.Errors),
		}))
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
	case "validate.log":
		return nestiaCoreValidatorObjectWithKey("type", "validate.log", "validate", nestiaCoreHttpValidateQuerifyProgrammer(prog, importer, ec, modulo, typ), ec)
	default:
		return nestiaCoreValidatorObject("type", "assert", nestiaCoreHttpAssertQuerifyProgrammer(prog, importer, ec, modulo, typ), ec)
	}
}

// nestiaCoreTypiaContext builds the typia transform context for a single
// validator generation. The importer argument is the file-scoped ImportProgrammer:
// on the AST-integration emit path it is the shared, ec-mode importer (so every
// generated validator references namespace imports tsgo's module-transform
// aliases, and all injected imports collapse into one ToStatements() set). A nil
// importer falls back to a throwaway one; no current caller relies on it.
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
		// tsgo's MarkLinkedReferences pass nil-panics during emit.
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

// NestiaCoreMethodReturnType returns the type of a route method's response body.
//
// The declared return type is used when it is `Promise<T>` or an rxjs `Observable<T>`, and `T` is returned, so an asynchronous method is typed by what it resolves to. A missing signature returns nil.
//
// @evidence contracts/common.md#principled-implementation An explicit annotation is unwrapped only when its resolved symbol declares the TypeScript library Promise or an rxjs-owned Observable. Otherwise the checker's resolved return type uses the same provenance rule, preserving user wrappers and allowing aliases to the library type. Global Promise augmentations retain the library declaration in their merged symbol.
// @evidence contracts/common.md#clear-and-simple-design One function with two unwrapping paths, sharing the private wrapper predicates.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The wrappers are the two types NestJS handlers return; no method or controller name is special-cased.
// @evidence contracts/common.md#meaningful-documentation The comment states the unwrapped wrappers and the nil result.
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
		nestiaCoreIsAsyncReturnWrapperSymbol(prog, symbol.Name, symbol.Declarations) {
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
	if NestiaCoreIsAsyncReturnWrapperReference(prog, ref.TypeName) == false {
		return nil
	}
	return prog.Checker.GetTypeFromTypeNode(ref.TypeArguments.Nodes[0])
}

// NestiaCoreIsAsyncReturnWrapperReference reports whether a type reference names
// a wrapper a route method's return type is unwrapped from: `Promise`, or the
// rxjs `Observable` however it is imported, aliased or re-exported.
//
// Promise must have a resolved declaration in the program's TypeScript library.
// Observable must have a resolved declaration owned by rxjs. A same-spelled
// user wrapper remains an ordinary response type.
//
// @evidence contracts/common.md#principled-implementation The checker resolves the reference and import aliases to their declarations. Promise requires a declaration in the compiler-identified library; Observable requires a nearest manifest naming rxjs. Namespace user types and missing library declarations cannot become asynchronous wrappers merely by spelling.
// @evidence contracts/common.md#clear-and-simple-design One function that resolves the symbol and delegates the name and ownership test to the shared symbol predicate, so the syntactic annotation path and the checker path of the return type use one rule; the SDK reads the same function rather than keeping a second copy.
// @evidence contracts/common.md#prohibited-implementation-shortcuts No source spelling, fixture identity, filename fragment or folder name substitutes for declaration provenance. The TypeScript program identifies its actual library files and the program filesystem supplies nearest package ownership.
// @evidence contracts/common.md#meaningful-documentation The comment identifies both supported wrappers and their declaration provenance requirements, including preservation of user lookalikes.
func NestiaCoreIsAsyncReturnWrapperReference(
	prog *driver.Program,
	node *shimast.Node,
) bool {
	if node == nil {
		return false
	}
	if prog == nil || prog.Checker == nil {
		return false
	}
	symbol := prog.Checker.GetSymbolAtLocation(node)
	if symbol != nil && symbol.Flags&shimast.SymbolFlagsAlias != 0 {
		if aliased := shimchecker.Checker_getAliasedSymbol(prog.Checker, symbol); aliased != nil {
			symbol = aliased
		}
	}
	return symbol != nil && nestiaCoreIsAsyncReturnWrapperSymbol(prog, symbol.Name, symbol.Declarations)
}

func nestiaCoreIsAsyncReturnWrapperSymbol(
	prog *driver.Program,
	name string,
	declarations []*shimast.Node,
) bool {
	if name == "Promise" && prog != nil && prog.TSProgram != nil {
		for _, decl := range declarations {
			if source := shimast.GetSourceFileOfNode(decl); source != nil && prog.TSProgram.IsLibFile(source) {
				return true
			}
		}
	}
	return name == "Observable" && nestiaCoreIsRxjsDeclarations(prog, declarations)
}

func nestiaCoreIsRxjsDeclarations(prog *driver.Program, declarations []*shimast.Node) bool {
	for _, decl := range declarations {
		sourceFile := shimast.GetSourceFileOfNode(decl)
		if sourceFile != nil && SourceFilePackageName(prog, sourceFile) == "rxjs" {
			return true
		}
	}
	return false
}

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

// NestiaCoreExpressionSegments returns the identifier segments of an identifier or a property-access chain, such as `core.TypedRoute.Get` as `core`, `TypedRoute`, `Get`, and nil for any other expression.
//
// @evidence contracts/common.md#principled-implementation The recursion follows the left side of each property access to its root identifier and appends the property names, and any other node kind makes the whole chain not a name, so a call, an element access, or a computed name is never read as a path.
// @evidence contracts/common.md#clear-and-simple-design One recursive function over two node kinds.
// @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the syntax only.
// @evidence contracts/common.md#meaningful-documentation The comment gives the example and the nil result.
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
