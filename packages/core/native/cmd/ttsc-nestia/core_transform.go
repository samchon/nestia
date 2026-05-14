package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"runtime/debug"
	"sort"
	"strconv"
	"strings"
	"sync"
	"unicode"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimchecker "github.com/microsoft/typescript-go/shim/checker"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	nativecontext "github.com/samchon/typia/packages/typia/native/core/context"
	nativefactories "github.com/samchon/typia/packages/typia/native/core/factories"
	nativeprogrammers "github.com/samchon/typia/packages/typia/native/core/programmers"
	nativehttp "github.com/samchon/typia/packages/typia/native/core/programmers/http"
	nativejson "github.com/samchon/typia/packages/typia/native/core/programmers/json"
	nativellm "github.com/samchon/typia/packages/typia/native/core/programmers/llm"
	nativemisc "github.com/samchon/typia/packages/typia/native/core/programmers/misc"
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
	File      *shimast.SourceFile
	FilePath  string
	Call      *shimast.CallExpression
	Modulo    *shimast.Node
	Kind      string
	Type      *shimchecker.Type
	ArgCount  int
	Segments  []string
	Arguments []string
}

type nestiaCoreTransformState struct {
	prog        *driver.Program
	options     nestiaCoreOptions
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

const nestiaCoreKindDecorator = shimast.KindDecorator

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

func collectNestiaCoreSourceRewriteMap(
	prog *driver.Program,
	plan plugin.Plan,
	onlyFile string,
) (map[string][]transformSourceRewrite, []typiaTransformDiagnostic) {
	if plan.Core == false {
		return map[string][]transformSourceRewrite{}, nil
	}
	options := readNestiaCoreOptions(plan)
	sites, diagnostics := collectNestiaCoreSites(newNestiaCoreTransformState(prog, options))
	rewrites := map[string][]transformSourceRewrite{}
	for _, site := range sites {
		if onlyFile != "" && filepath.ToSlash(site.FilePath) != filepath.ToSlash(onlyFile) {
			continue
		}
		source, ok := sourceFileText(site.File)
		if !ok {
			diagnostics = append(diagnostics, nestiaCoreDiagnostic(site, "source text is unavailable"))
			continue
		}
		open, close, ok := callArgumentBounds(source, site.Call)
		if !ok {
			diagnostics = append(diagnostics, nestiaCoreDiagnostic(site, "failed to locate decorator arguments"))
			continue
		}
		replacement := appendArgumentsText(source[open+1:close], site.Arguments)
		rewrites[filepath.ToSlash(site.FilePath)] = append(rewrites[filepath.ToSlash(site.FilePath)], transformSourceRewrite{
			start:       open + 1,
			end:         close,
			replacement: replacement,
		})
	}
	return rewrites, diagnostics
}

func collectNestiaCoreBuildRewrites(
	prog *driver.Program,
	plan plugin.Plan,
	rewrites *nativeRewriteSet,
) []typiaTransformDiagnostic {
	if plan.Core == false {
		return nil
	}
	options := readNestiaCoreOptions(plan)
	sites, diagnostics := collectNestiaCoreSites(newNestiaCoreTransformState(prog, options))
	for _, site := range sites {
		expectedArgumentCount := site.ArgCount
		expectedArgumentsText := nestiaCoreStableOriginalArgumentText(site)
		rewrites.Add(nativeRewrite{
			FilePath:                   site.FilePath,
			RootName:                   site.Segments[0],
			Namespaces:                 site.Segments[1:],
			AppendArguments:            site.Arguments,
			TargetExpressionCandidates: nestiaCoreTargetCandidates(prog, site),
			SourceStart:                site.Call.AsNode().Pos(),
			ExpectedArgumentCount:      &expectedArgumentCount,
			ExpectedArgumentsText:      expectedArgumentsText,
		})
	}
	return diagnostics
}

func nestiaCoreOriginalArgumentText(site nestiaCoreSite) string {
	source, ok := sourceFileText(site.File)
	if !ok {
		return ""
	}
	open, close, ok := callArgumentBounds(source, site.Call)
	if !ok {
		return ""
	}
	return strings.TrimSpace(source[open+1 : close])
}

func nestiaCoreStableOriginalArgumentText(site nestiaCoreSite) string {
	text := nestiaCoreOriginalArgumentText(site)
	if strings.Contains(text, "=>") || strings.Contains(text, "function") {
		return ""
	}
	return text
}

func collectNestiaCoreSites(state *nestiaCoreTransformState) ([]nestiaCoreSite, []typiaTransformDiagnostic) {
	sites := []nestiaCoreSite{}
	diagnostics := []typiaTransformDiagnostic{}
	prog := state.prog
	if nestiaCoreStrictMode(prog) == false {
		diagnostics = append(diagnostics, nestiaCoreGlobalDiagnostic("@nestia/core", "strict mode is required."))
	}
	for _, file := range prog.SourceFiles() {
		if file == nil || file.IsDeclarationFile {
			continue
		}
		context := newNestiaCoreFileContext(file)
		file.ForEachChild(func(node *shimast.Node) bool {
			visitNestiaCoreNode(state, context, node, &sites, &diagnostics)
			return false
		})
	}
	if os.Getenv("TTSC_NESTIA_PROFILE") != "" {
		fmt.Fprintf(stderr, "ttsc-nestia profile: core-cache hits=%d misses=%d\n", state.cacheHits, state.cacheMisses)
	}
	return sites, diagnostics
}

func visitNestiaCoreNode(
	state *nestiaCoreTransformState,
	context nestiaCoreFileContext,
	node *shimast.Node,
	sites *[]nestiaCoreSite,
	diagnostics *[]typiaTransformDiagnostic,
) {
	if node == nil {
		return
	}
	switch node.Kind {
	case shimast.KindParameter:
		decorators := node.Decorators()
		if len(decorators) == 0 {
			break
		}
		type candidate struct {
			decorator *shimast.Node
			call      *shimast.CallExpression
			segments  []string
			kind      string
		}
		candidates := []candidate{}
		for _, decorator := range decorators {
			call, segments, ok := nestiaCoreRawDecoratorCall(decorator)
			if !ok {
				continue
			}
			canonical := nestiaCoreCanonicalSegments(context, segments)
			kind := nestiaCoreParameterKind(canonical)
			if kind == "" || nestiaCoreDecoratorReference(state.prog, context, decorator, segments, canonical) == false {
				continue
			}
			candidates = append(candidates, candidate{
				decorator: decorator,
				call:      call,
				segments:  segments,
				kind:      kind,
			})
		}
		if len(candidates) == 0 {
			break
		}
		typ := state.prog.Checker.GetTypeAtLocation(node)
		for _, candidate := range candidates {
			site, ok, err := transformNestiaCoreParameterDecorator(
				state,
				context.file,
				candidate.call,
				candidate.segments,
				candidate.kind,
				typ,
			)
			if err != nil {
				*diagnostics = append(*diagnostics, nestiaCoreDiagnostic(site, err.Error()))
			} else if ok {
				*sites = append(*sites, site)
			}
		}
	case shimast.KindMethodDeclaration:
		decorators := node.Decorators()
		if len(decorators) == 0 {
			break
		}
		type candidate struct {
			call     *shimast.CallExpression
			segments []string
			kind     string
		}
		candidates := []candidate{}
		for _, decorator := range decorators {
			call, segments, ok := nestiaCoreRawDecoratorCall(decorator)
			if !ok {
				continue
			}
			canonical := nestiaCoreCanonicalSegments(context, segments)
			if nestiaCoreDecoratorReference(state.prog, context, decorator, segments, canonical) == false {
				continue
			}
			if len(canonical) != 0 && canonical[len(canonical)-1] == "WebSocketRoute" {
				*diagnostics = append(*diagnostics, validateNestiaCoreWebSocketRoute(state.prog, context, node, call, canonical)...)
			}
			kind := nestiaCoreMethodKind(canonical)
			if kind == "" || nestiaCoreShouldSkipMethodDecorator(state.prog, call) {
				continue
			}
			candidates = append(candidates, candidate{
				call:     call,
				segments: segments,
				kind:     kind,
			})
		}
		if len(candidates) == 0 {
			break
		}
		typ := nestiaCoreMethodReturnType(state.prog, node)
		if typ != nil {
			for _, candidate := range candidates {
				site, ok, err := transformNestiaCoreMethodDecorator(
					state,
					context.file,
					candidate.call,
					candidate.segments,
					candidate.kind,
					typ,
				)
				if err != nil {
					*diagnostics = append(*diagnostics, nestiaCoreDiagnostic(site, err.Error()))
				} else if ok {
					*sites = append(*sites, site)
				}
			}
		}
	}
	node.ForEachChild(func(child *shimast.Node) bool {
		visitNestiaCoreNode(state, context, child, sites, diagnostics)
		return false
	})
}

func transformNestiaCoreParameterDecorator(
	state *nestiaCoreTransformState,
	file *shimast.SourceFile,
	call *shimast.CallExpression,
	segments []string,
	kind string,
	typ *shimchecker.Type,
) (nestiaCoreSite, bool, error) {
	modulo := nestiaCoreModuloNode(call.Expression)
	arguments, ok, err := state.parameterArguments(call, segments, modulo, kind, typ)
	if err != nil || !ok {
		return nestiaCoreSite{
			File:     file,
			FilePath: file.FileName(),
			Call:     call,
			Modulo:   modulo,
			Kind:     kind,
			Type:     typ,
			Segments: segments,
		}, ok, err
	}
	return nestiaCoreSite{
		File:      file,
		FilePath:  file.FileName(),
		Call:      call,
		Modulo:    modulo,
		Kind:      kind,
		Type:      typ,
		ArgCount:  nestiaCoreArgumentCount(call),
		Segments:  segments,
		Arguments: arguments,
	}, true, nil
}

func transformNestiaCoreMethodDecorator(
	state *nestiaCoreTransformState,
	file *shimast.SourceFile,
	call *shimast.CallExpression,
	segments []string,
	kind string,
	typ *shimchecker.Type,
) (nestiaCoreSite, bool, error) {
	modulo := nestiaCoreModuloNode(call.Expression)
	arguments, err := state.methodArguments(file, segments, modulo, kind, typ, nestiaCoreArgumentCount(call))
	if err != nil {
		return nestiaCoreSite{
			File:     file,
			FilePath: file.FileName(),
			Call:     call,
			Modulo:   modulo,
			Kind:     kind,
			Type:     typ,
			Segments: segments,
		}, false, err
	}
	return nestiaCoreSite{
		File:      file,
		FilePath:  file.FileName(),
		Call:      call,
		Modulo:    modulo,
		Kind:      kind,
		Type:      typ,
		ArgCount:  nestiaCoreArgumentCount(call),
		Segments:  segments,
		Arguments: arguments,
	}, true, nil
}

func (state *nestiaCoreTransformState) parameterArguments(
	call *shimast.CallExpression,
	segments []string,
	modulo *shimast.Node,
	kind string,
	typ *shimchecker.Type,
) ([]string, bool, error) {
	key := state.cacheKey(segments, kind, typ, nestiaCoreArgumentCount(call), kind == "TypedQuery")
	return state.cachedArguments(key, func() ([]string, bool, error) {
		return nestiaCoreParameterArguments(state.prog, state.options, call, modulo, kind, typ)
	})
}

func (state *nestiaCoreTransformState) methodArguments(
	file *shimast.SourceFile,
	segments []string,
	modulo *shimast.Node,
	kind string,
	typ *shimchecker.Type,
	argCount int,
) ([]string, error) {
	key := state.cacheKey(segments, kind, typ, argCount, kind == "TypedQueryRoute")
	arguments, _, err := state.cachedArguments(key, func() ([]string, bool, error) {
		arg, err := safeNestiaCoreGenerate(func() (*shimast.Node, error) {
			switch kind {
			case "TypedQueryRoute":
				return nestiaCoreGenerateTypedQueryRoute(state.prog, state.options, modulo, typ), nil
			default:
				return nestiaCoreGenerateTypedRoute(state.prog, state.options, modulo, typ), nil
			}
		}, state.prog, file, false)
		if err != nil {
			return nil, false, err
		}
		return []string{arg}, true, nil
	})
	return arguments, err
}

func (state *nestiaCoreTransformState) cachedArguments(
	key nestiaCoreCacheKey,
	generate func() ([]string, bool, error),
) ([]string, bool, error) {
	if cached, ok := state.cache[key]; ok {
		state.cacheHits++
		return append([]string(nil), cached...), true, nil
	}
	state.cacheMisses++
	arguments, ok, err := generate()
	if err != nil || ok == false {
		return arguments, ok, err
	}
	state.cache[key] = append([]string(nil), arguments...)
	return append([]string(nil), arguments...), true, nil
}

func (state *nestiaCoreTransformState) cacheKey(
	segments []string,
	kind string,
	typ *shimchecker.Type,
	argCount int,
	allowOptional bool,
) nestiaCoreCacheKey {
	return nestiaCoreCacheKey{
		Kind:          kind,
		Type:          typ,
		TypeName:      nestiaCoreTypeNameText(state.prog, typ),
		Modulo:        strings.Join(segments, "."),
		Validate:      state.options.Validate,
		Stringify:     state.options.Stringify,
		StringifyNull: state.options.StringifyNull,
		Llm:           state.options.Llm,
		LlmStrict:     state.options.LlmStrict,
		ArgCount:      argCount,
		AllowOptional: allowOptional,
	}
}

func nestiaCoreRawDecoratorCall(decorator *shimast.Node) (*shimast.CallExpression, []string, bool) {
	if decorator == nil || decorator.Kind != nestiaCoreKindDecorator {
		return nil, nil, false
	}
	expression := decorator.AsDecorator().Expression
	if expression == nil || expression.Kind != shimast.KindCallExpression {
		return nil, nil, false
	}
	call := expression.AsCallExpression()
	segments := nestiaCoreExpressionSegments(call.Expression)
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
	return isNestiaCoreCall(prog, decorator.AsDecorator().Expression)
}

func nestiaCorePotentialDecoratorSegments(segments []string) bool {
	return nestiaCoreParameterKind(segments) != "" ||
		nestiaCoreMethodKind(segments) != "" ||
		(len(segments) != 0 && segments[len(segments)-1] == "WebSocketRoute")
}

func isNestiaCoreCall(prog *driver.Program, node *shimast.Node) bool {
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

func isNestiaCoreImportedExpression(node *shimast.Node, segments []string) bool {
	if len(segments) == 0 {
		return false
	}
	source := shimast.GetSourceFileOfNode(node)
	if source == nil || source.Statements == nil {
		return false
	}
	root := segments[0]
	for _, stmt := range source.Statements.Nodes {
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
		if name := clause.Name(); name != nil && name.Text() == root {
			return true
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
			if name != nil && name.Text() == root {
				return true
			}
		}
	}
	return false
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

func nestiaCoreParameterArguments(
	prog *driver.Program,
	options nestiaCoreOptions,
	call *shimast.CallExpression,
	modulo *shimast.Node,
	kind string,
	typ *shimchecker.Type,
) ([]string, bool, error) {
	argCount := nestiaCoreArgumentCount(call)
	switch kind {
	case "TypedBody", "TypedHeaders", "TypedQuery", "TypedQueryBody", "PlainBody":
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
	expr, err := safeNestiaCoreGenerate(func() (*shimast.Node, error) {
		switch kind {
		case "TypedBody":
			return nestiaCoreGenerateTypedBody(prog, options, modulo, typ), nil
		case "TypedHeaders":
			return nestiaCoreGenerateTypedHeaders(prog, options, modulo, typ), nil
		case "TypedParam":
			return nestiaCoreGenerateTypedParam(prog, modulo, typ), nil
		case "TypedQuery":
			return nestiaCoreGenerateTypedQuery(prog, options, modulo, typ, true), nil
		case "TypedQueryBody":
			return nestiaCoreGenerateTypedQuery(prog, options, modulo, typ, false), nil
		case "TypedFormDataBody":
			return nestiaCoreGenerateTypedFormDataBody(prog, options, modulo, typ), nil
		case "PlainBody":
			return nestiaCoreGeneratePlainBody(prog, modulo, typ), nil
		default:
			return nil, fmt.Errorf("unsupported parameter decorator %s", kind)
		}
	}, prog, shimast.GetSourceFileOfNode(call.AsNode()), false)
	if err != nil {
		return nil, false, err
	}
	output := []string{}
	if kind == "TypedFormDataBody" && argCount == 0 {
		output = append(output, "undefined")
	}
	output = append(output, expr)
	if kind == "TypedParam" && strings.HasPrefix(options.Validate, "validate") {
		output = append(output, "true")
	}
	return output, true, nil
}

func nestiaCoreGenerateTypedBody(
	prog *driver.Program,
	options nestiaCoreOptions,
	modulo *shimast.Node,
	typ *shimchecker.Type,
) *shimast.Node {
	nestiaCoreValidateTypedBody(prog, options, typ)
	context := nestiaCoreTypiaContext(prog, false, false, false)
	name := nestiaCoreTypeName(prog, typ)
	category := options.Validate
	switch category {
	case "assert":
		return nestiaCoreValidatorObject("type", "assert", nativeprogrammers.AssertProgrammer.Write(nativeprogrammers.AssertProgrammer_IProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
			Config: nativeprogrammers.AssertProgrammer_IConfig{Equals: false, Guard: false},
		}))
	case "is":
		return nestiaCoreValidatorObject("type", "is", nativeprogrammers.IsProgrammer.Write(nativeprogrammers.IsProgrammer_IProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
			Config: nativeprogrammers.IsProgrammer_IConfig{Equals: false},
		}))
	case "validateEquals":
		return nestiaCoreValidatorObject("type", "validate", nativeprogrammers.ValidateProgrammer.Write(nativeprogrammers.ValidateProgrammer_IProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
			Config: nativeprogrammers.ValidateProgrammer_IConfig{Equals: true},
		}))
	case "equals":
		return nestiaCoreValidatorObject("type", "is", nativeprogrammers.IsProgrammer.Write(nativeprogrammers.IsProgrammer_IProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
			Config: nativeprogrammers.IsProgrammer_IConfig{Equals: true},
		}))
	case "assertEquals":
		return nestiaCoreValidatorObject("type", "assert", nativeprogrammers.AssertProgrammer.Write(nativeprogrammers.AssertProgrammer_IProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
			Config: nativeprogrammers.AssertProgrammer_IConfig{Equals: true, Guard: false},
		}))
	case "assertClone":
		return nestiaCoreValidatorObject("type", "assert", nativemisc.MiscAssertCloneProgrammer.Write(nativecontext.IProgrammerProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
		}))
	case "validateClone":
		return nestiaCoreValidatorObject("type", "validate", nativemisc.MiscValidateCloneProgrammer.Write(nativecontext.IProgrammerProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
		}))
	case "assertPrune":
		return nestiaCoreValidatorObject("type", "assert", nativemisc.MiscAssertPruneProgrammer.Write(nativecontext.IProgrammerProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
		}))
	case "validatePrune":
		return nestiaCoreValidatorObject("type", "validate", nativemisc.MiscValidatePruneProgrammer.Write(nativecontext.IProgrammerProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
		}))
	default:
		return nestiaCoreValidatorObject("type", "validate", nativeprogrammers.ValidateProgrammer.Write(nativeprogrammers.ValidateProgrammer_IProps{
			Context: context, Modulo: modulo, Type: typ, Name: name,
			Config: nativeprogrammers.ValidateProgrammer_IConfig{Equals: false},
		}))
	}
}

func nestiaCoreGenerateTypedHeaders(prog *driver.Program, options nestiaCoreOptions, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	context := nestiaCoreTypiaContext(prog, false, false, false)
	name := nestiaCoreTypeName(prog, typ)
	category := options.Validate
	if category == "is" || category == "equals" {
		return nestiaCoreValidatorObject("type", "is", nativehttp.HttpIsHeadersProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}))
	}
	if strings.HasPrefix(category, "validate") {
		return nestiaCoreValidatorObject("type", "validate", nativehttp.HttpValidateHeadersProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}))
	}
	return nestiaCoreValidatorObject("type", "assert", nativehttp.HttpAssertHeadersProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}))
}

func nestiaCoreGenerateTypedParam(prog *driver.Program, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	return nativehttp.HttpParameterProgrammer.Write(nativecontext.IProgrammerProps{
		Context: nestiaCoreTypiaContext(prog, true, false, false),
		Modulo:  modulo,
		Type:    typ,
		Name:    nestiaCoreTypeName(prog, typ),
	})
}

func nestiaCoreGenerateTypedQuery(prog *driver.Program, options nestiaCoreOptions, modulo *shimast.Node, typ *shimchecker.Type, allowOptional bool) *shimast.Node {
	nestiaCoreValidateTypedQuery(prog, options, typ, allowOptional, "@nestia.core.TypedQuery")
	context := nestiaCoreTypiaContext(prog, false, false, false)
	name := nestiaCoreTypeName(prog, typ)
	category := options.Validate
	if category == "is" || category == "equals" {
		return nestiaCoreValidatorObject("type", "is", nativehttp.HttpIsQueryProgrammer.Write(nativehttp.HttpIsQueryProgrammer_IProps{Context: context, Modulo: modulo, Type: typ, Name: name, AllowOptional: allowOptional}))
	}
	if category == "validate" || category == "validateEquals" || category == "validateClone" || category == "validatePrune" {
		return nestiaCoreValidatorObject("type", "validate", nativehttp.HttpValidateQueryProgrammer.Write(nativehttp.HttpValidateQueryProgrammer_IProps{Context: context, Modulo: modulo, Type: typ, Name: name, AllowOptional: allowOptional}))
	}
	return nestiaCoreValidatorObject("type", "assert", nativehttp.HttpAssertQueryProgrammer.Write(nativehttp.HttpAssertQueryProgrammer_IProps{Context: context, Modulo: modulo, Type: typ, Name: name, AllowOptional: allowOptional}))
}

func nestiaCoreGenerateTypedFormDataBody(prog *driver.Program, options nestiaCoreOptions, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	context := nestiaCoreTypiaContext(prog, false, false, false)
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
	return nestiaCoreFactory.NewObjectLiteralExpression(nestiaCoreFactory.NewNodeList([]*shimast.Node{
		nestiaCoreProperty("files", nestiaCoreFormDataFilesExpression(files)),
		nestiaCoreProperty("validator", nestiaCoreValidatorObject("type", key, validator)),
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

func nestiaCoreFormDataFilesExpression(files []nestiaCoreFormDataFile) *shimast.Node {
	elements := make([]*shimast.Node, 0, len(files))
	for _, file := range files {
		limit := nestiaCoreFactory.NewKeywordExpression(shimast.KindNullKeyword)
		if file.Limit != nil {
			limit = nativefactories.LiteralFactory.Write(*file.Limit)
		}
		elements = append(elements, nestiaCoreFactory.NewObjectLiteralExpression(nestiaCoreFactory.NewNodeList([]*shimast.Node{
			nestiaCoreProperty("name", nativefactories.LiteralFactory.Write(file.Name)),
			nestiaCoreProperty("limit", limit),
		}), true))
	}
	return nestiaCoreFactory.NewArrayLiteralExpression(nestiaCoreFactory.NewNodeList(elements), true)
}

func nestiaCoreGeneratePlainBody(prog *driver.Program, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	nestiaCoreValidatePlainBody(prog, typ)
	return nativeprogrammers.AssertProgrammer.Write(nativeprogrammers.AssertProgrammer_IProps{
		Context: nestiaCoreTypiaContext(prog, false, false, false),
		Modulo:  modulo,
		Type:    typ,
		Name:    nestiaCoreTypeName(prog, typ),
		Config:  nativeprogrammers.AssertProgrammer_IConfig{Equals: false, Guard: false},
	})
}

func nestiaCoreGenerateTypedRoute(prog *driver.Program, options nestiaCoreOptions, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	nestiaCoreValidateTypedRoute(prog, options, typ)
	if options.StringifyNull {
		return nestiaCoreFactory.NewKeywordExpression(shimast.KindNullKeyword)
	}
	context := nestiaCoreTypiaContext(prog, false, false, false)
	name := nestiaCoreTypeName(prog, typ)
	switch options.Stringify {
	case "is":
		return nestiaCoreValidatorObject("type", "is", nativejson.JsonIsStringifyProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}))
	case "validate":
		return nestiaCoreValidatorObject("type", "validate", nativejson.JsonValidateStringifyProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}))
	case "stringify":
		return nestiaCoreValidatorObject("type", "stringify", nativejson.JsonStringifyProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}))
	case "validate.log":
		return nestiaCoreValidatorObjectWithKey("type", "validate.log", "validate", nativejson.JsonValidateStringifyProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}))
	default:
		return nestiaCoreValidatorObject("type", "assert", nativejson.JsonAssertStringifyProgrammer.Write(nativecontext.IProgrammerProps{Context: context, Modulo: modulo, Type: typ, Name: name}))
	}
}

func nestiaCoreGenerateTypedQueryRoute(prog *driver.Program, options nestiaCoreOptions, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	nestiaCoreValidateTypedQueryRoute(prog, options, typ)
	if options.StringifyNull {
		return nestiaCoreFactory.NewKeywordExpression(shimast.KindNullKeyword)
	}
	switch options.Stringify {
	case "is":
		return nestiaCoreValidatorObject("type", "is", nestiaCoreHttpIsQuerifyProgrammer(prog, modulo, typ))
	case "validate":
		return nestiaCoreValidatorObject("type", "validate", nestiaCoreHttpValidateQuerifyProgrammer(prog, modulo, typ))
	case "stringify":
		return nestiaCoreValidatorObject("type", "stringify", nestiaCoreHttpQuerifyProgrammer(prog, typ))
	default:
		return nestiaCoreValidatorObject("type", "assert", nestiaCoreHttpAssertQuerifyProgrammer(prog, modulo, typ))
	}
}

func nestiaCoreTypiaContext(prog *driver.Program, numeric bool, finite bool, functional bool) nativecontext.ITypiaContext {
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
		Importer: nativeprogrammers.NewImportProgrammer(nativeprogrammers.ImportProgrammer_IOptions{
			InternalPrefix: "typia_transform_",
			Runtime:        "typia",
		}),
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

func nestiaCoreValidatorObject(typeKey string, key string, validator *shimast.Node) *shimast.Node {
	return nestiaCoreValidatorObjectWithKey(typeKey, key, key, validator)
}

func nestiaCoreValidatorObjectWithKey(typeKey string, typeValue string, validatorKey string, validator *shimast.Node) *shimast.Node {
	return nestiaCoreFactory.NewObjectLiteralExpression(nestiaCoreFactory.NewNodeList([]*shimast.Node{
		nestiaCoreProperty(typeKey, nestiaCoreFactory.NewStringLiteral(typeValue, shimast.TokenFlagsNone)),
		nestiaCoreProperty(validatorKey, validator),
	}), true)
}

func nestiaCoreProperty(name string, initializer *shimast.Node) *shimast.Node {
	return nestiaCoreFactory.NewPropertyAssignment(
		nil,
		nativefactories.IdentifierFactory.Identifier(name),
		nil,
		nil,
		initializer,
	)
}

func safeNestiaCoreGenerate(
	generator func() (*shimast.Node, error),
	prog *driver.Program,
	file *shimast.SourceFile,
	preserveTypes bool,
) (text string, err error) {
	defer func() {
		if exp := recover(); exp != nil {
			if os.Getenv("NESTIA_NATIVE_DEBUG_STACK") != "" {
				err = fmt.Errorf("%v\n%s", exp, debug.Stack())
			} else {
				err = fmt.Errorf("%v", exp)
			}
		}
	}()
	node, err := generator()
	if err != nil {
		return "", err
	}
	return emitNestiaCoreExpression(prog, file, node, preserveTypes), nil
}

func emitNestiaCoreExpression(prog *driver.Program, file *shimast.SourceFile, node *shimast.Node, preserveTypes bool) string {
	var text string
	if preserveTypes {
		text = emitNestiaPreservingTypesWithIdentifierSubstitutions(node, file, nil)
	} else {
		text = emitNestiaWithIdentifierSubstitutions(
			node,
			file,
			identifierSubstitutionsForEmit(prog, file),
		)
	}
	return cleanupNestiaCorePrintedExpression(text)
}

func cleanupNestiaCorePrintedExpression(text string) string {
	text = strings.TrimSpace(text)
	text = strings.TrimSuffix(text, ";")
	text = nestiaCoreSingleParameterArrowPattern.ReplaceAllString(text, `${1}(${2}) =>`)
	if strings.HasPrefix(text, "(") && strings.HasSuffix(text, ")") {
		return text
	}
	if strings.Contains(text, "=>") || strings.Contains(text, "function") {
		return "(" + text + ")"
	}
	return text
}

var nestiaCoreSingleParameterArrowPattern = regexp.MustCompile(`(^|[\s(=,:?])([A-Za-z_$][A-Za-z0-9_$]*) =>`)

func nestiaCoreMethodReturnType(prog *driver.Program, node *shimast.Node) *shimchecker.Type {
	signature := prog.Checker.GetSignatureFromDeclaration(node)
	if signature == nil {
		return nil
	}
	typ := prog.Checker.GetReturnTypeOfSignature(signature)
	if typ == nil {
		return nil
	}
	symbol := typ.Symbol()
	if symbol != nil && symbol.Name == "Promise" {
		args := prog.Checker.GetTypeArguments(typ)
		if len(args) == 1 {
			return args[0]
		}
	}
	return typ
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
	source, ok := sourceFileText(shimast.GetSourceFileOfNode(call.AsNode()))
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
	close, ok := matchNativeParen(source, open)
	return open, close, ok
}

func appendArgumentsText(current string, arguments []string) string {
	current = strings.TrimSpace(current)
	next := strings.Join(arguments, ", ")
	if current == "" {
		return next
	}
	return current + ", " + next
}

func nestiaCoreExpressionSegments(node *shimast.Node) []string {
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
		left := nestiaCoreExpressionSegments(access.Expression)
		name := access.Name()
		if len(left) == 0 || name == nil || name.Kind != shimast.KindIdentifier {
			return nil
		}
		return append(left, name.AsIdentifier().Text)
	}
	return nil
}

func nestiaCoreModuloNode(node *shimast.Node) *shimast.Node {
	segments := nestiaCoreExpressionSegments(node)
	if len(segments) == 0 {
		return nestiaCoreFactory.NewIdentifier("nestia_core_transform")
	}
	return nestiaCoreFactory.NewIdentifier(strings.Join(segments, "_"))
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

func nestiaCoreTargetCandidates(prog *driver.Program, site nestiaCoreSite) []string {
	if len(site.Segments) == 0 {
		return nil
	}
	candidates := []string{strings.Join(site.Segments, ".")}
	substitutions := identifierSubstitutionsForEmit(prog, site.File)
	if substitutions != nil {
		if mapped, ok := substitutions[site.Segments[0]]; ok {
			parts := append([]string{mapped}, site.Segments[1:]...)
			candidates = append(candidates, strings.Join(parts, "."))
		}
	}
	sort.SliceStable(candidates, func(i, j int) bool {
		return len(candidates[i]) > len(candidates[j])
	})
	return candidates
}

func identifierSubstitutionsForEmit(program *driver.Program, file any) map[string]string {
	if program == nil {
		return nil
	}
	sourceFile, ok := file.(*shimast.SourceFile)
	if ok == false {
		return nil
	}
	return commonJSImportIdentifierSubstitutions(sourceFile)
}

type commonJSImportIdentifierSubstitutionsCacheEntry struct {
	value map[string]string
}

var commonJSImportIdentifierSubstitutionsCache sync.Map

func commonJSImportIdentifierSubstitutions(file *shimast.SourceFile) map[string]string {
	if file == nil || file.Statements == nil {
		return nil
	}
	if cached, ok := commonJSImportIdentifierSubstitutionsCache.Load(file); ok {
		return cached.(commonJSImportIdentifierSubstitutionsCacheEntry).value
	}
	output := map[string]string{}
	counts := map[string]int{}
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
		base := commonJSImportAliasBase(decl.ModuleSpecifier.Text())
		counts[base]++
		moduleAlias := base + "_" + strconv.Itoa(counts[base])
		if name := clause.Name(); name != nil {
			output[name.Text()] = moduleAlias + ".default"
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
			if name == nil {
				continue
			}
			local := name.Text()
			imported := local
			if spec.PropertyName != nil {
				imported = spec.PropertyName.Text()
			}
			output[local] = moduleAlias + "." + imported
		}
	}
	if len(output) == 0 {
		output = nil
	}
	commonJSImportIdentifierSubstitutionsCache.Store(file, commonJSImportIdentifierSubstitutionsCacheEntry{value: output})
	return output
}

func commonJSImportAliasBase(module string) string {
	base := strings.TrimSuffix(filepath.Base(module), filepath.Ext(module))
	if base == "" || base == "." || base == string(filepath.Separator) {
		base = "mod"
	}
	var builder strings.Builder
	for _, r := range base {
		if r == '_' || r == '$' || unicode.IsLetter(r) || unicode.IsDigit(r) {
			builder.WriteRune(r)
		} else {
			builder.WriteByte('_')
		}
	}
	text := builder.String()
	if text == "" {
		text = "mod"
	}
	first := []rune(text)[0]
	if first != '_' && first != '$' && !unicode.IsLetter(first) {
		text = "_" + text
	}
	return text
}

func nestiaCoreDiagnostic(site nestiaCoreSite, message string) typiaTransformDiagnostic {
	return typiaTransformDiagnostic{
		File:    site.FilePath,
		Code:    "nestia.core." + site.Kind,
		Message: message,
	}
}

func nestiaCoreGlobalDiagnostic(code string, message string) typiaTransformDiagnostic {
	return typiaTransformDiagnostic{
		Code:    code,
		Message: message,
	}
}
