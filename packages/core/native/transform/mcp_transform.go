package transform

import (
	"fmt"
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimchecker "github.com/microsoft/typescript-go/shim/checker"
	shimprinter "github.com/microsoft/typescript-go/shim/printer"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	nativecontext "github.com/samchon/typia/packages/typia/native/core/context"
	nativefactories "github.com/samchon/typia/packages/typia/native/core/factories"
	nativellm "github.com/samchon/typia/packages/typia/native/core/programmers/llm"
	schemametadata "github.com/samchon/typia/packages/typia/native/core/schemas/metadata"
)

func nestiaCoreGenerateMcpRouteParams(
	prog *driver.Program,
	importer *nativecontext.ImportProgrammer,
	ec *shimprinter.EmitContext,
	options nestiaCoreOptions,
	modulo *shimast.Node,
	typ *shimchecker.Type,
) *shimast.Node {
	nestiaCoreAnalyzeMcpParameters(prog, typ)
	return nestiaCoreGenerateTypedBody(prog, importer, ec, options, modulo, typ)
}

func nestiaCoreMcpRouteArgumentNode(
	prog *driver.Program,
	importer *nativecontext.ImportProgrammer,
	ec *shimprinter.EmitContext,
	_ nestiaCoreOptions,
	file *shimast.SourceFile,
	method *shimast.Node,
	call *shimast.CallExpression,
	returnType *shimchecker.Type,
) (*shimast.Node, error) {
	return safeNestiaCoreGenerateNode(func() (*shimast.Node, error) {
		if nestiaCoreArgumentCount(call) != 1 {
			return nil, fmt.Errorf("@McpRoute() requires one string literal tool name")
		}
		input := call.Arguments.Nodes[0]
		if input.Kind != shimast.KindStringLiteral && input.Kind != shimast.KindObjectLiteralExpression {
			return nil, fmt.Errorf("@McpRoute() argument must be a string literal tool name")
		}
		param, err := nestiaCoreMcpRouteParameter(prog, method)
		if err != nil {
			return nil, err
		}
		inputSchema := nativellm.LlmParametersProgrammer.Write(nativellm.LlmParametersProgrammer_IWriteProps{
			Context:  nestiaCoreTypiaContext(prog, importer, ec, false, false, false),
			Metadata: nestiaCoreAnalyzeMcpParameters(prog, param.typ),
			Config:   nestiaCoreMcpLlmConfig(),
		})
		nestiaCoreAnalyzeMcpReturn(prog, returnType)
		doc := nestiaCoreMcpRouteJSDoc(file, method)
		return nestiaCoreMcpRouteConfigNode(input, inputSchema, doc, ec), nil
	})
}

func nestiaCoreMcpRouteConfigNode(
	input *shimast.Node,
	inputSchema *shimast.Node,
	doc nestiaCoreMcpRouteDoc,
	ec *shimprinter.EmitContext,
) *shimast.Node {
	f := nativecontext.EmitFactoryOf(nestiaCoreFactory, ec)
	properties := []*shimast.Node{}
	if input.Kind == shimast.KindStringLiteral {
		properties = append(properties, nestiaCoreProperty("name", f.NewStringLiteral(input.Text(), shimast.TokenFlagsNone), ec))
	} else {
		if literal := input.AsObjectLiteralExpression(); literal != nil && literal.Properties != nil {
			properties = append(properties, literal.Properties.Nodes...)
		}
	}
	if nestiaCoreObjectLiteralHasProperty(properties, "inputSchema") == false {
		properties = append(properties, nestiaCoreProperty("inputSchema", inputSchema, ec))
	}
	if doc.Description != "" && nestiaCoreObjectLiteralHasProperty(properties, "description") == false {
		properties = append(properties, nestiaCoreProperty("description", f.NewStringLiteral(doc.Description, shimast.TokenFlagsNone), ec))
	}
	if doc.Title != "" && nestiaCoreObjectLiteralHasProperty(properties, "title") == false {
		properties = append(properties, nestiaCoreProperty("title", f.NewStringLiteral(doc.Title, shimast.TokenFlagsNone), ec))
	}
	return f.NewObjectLiteralExpression(f.NewNodeList(properties), true)
}

func nestiaCoreMcpRouteAlreadyTransformed(call *shimast.CallExpression) bool {
	if call == nil || nestiaCoreArgumentCount(call) != 1 {
		return false
	}
	arg := call.Arguments.Nodes[0]
	if arg == nil || arg.Kind != shimast.KindObjectLiteralExpression {
		return false
	}
	literal := arg.AsObjectLiteralExpression()
	if literal == nil || literal.Properties == nil {
		return false
	}
	return nestiaCoreObjectLiteralHasProperty(literal.Properties.Nodes, "inputSchema")
}

func nestiaCoreObjectLiteralHasProperty(properties []*shimast.Node, name string) bool {
	for _, property := range properties {
		if property == nil || property.Kind != shimast.KindPropertyAssignment {
			continue
		}
		if prop := property.AsPropertyAssignment(); prop != nil && nestiaCorePropertyNameText(prop.Name()) == name {
			return true
		}
	}
	return false
}

func nestiaCorePropertyNameText(node *shimast.Node) string {
	if node == nil {
		return ""
	}
	switch node.Kind {
	case shimast.KindIdentifier, shimast.KindStringLiteral:
		return node.Text()
	default:
		return ""
	}
}

type nestiaCoreMcpRouteParam struct {
	index int
	typ   *shimchecker.Type
}

func nestiaCoreMcpRouteParameter(prog *driver.Program, method *shimast.Node) (nestiaCoreMcpRouteParam, error) {
	decl := method.AsMethodDeclaration()
	methodName := nestiaCoreMcpMethodName(method)
	count := 0
	if decl.Parameters != nil {
		count = len(decl.Parameters.Nodes)
	}
	if count != 1 {
		return nestiaCoreMcpRouteParam{}, fmt.Errorf("@McpRoute method %q must declare exactly one @McpRoute.Params() parameter", methodName)
	}
	found := []int{}
	for index, param := range decl.Parameters.Nodes {
		for _, decorator := range param.Decorators() {
			_, segments, ok := nestiaCoreDecoratorCall(prog, decorator)
			if ok && nestiaCoreParameterKind(segments) == "McpRouteParams" {
				found = append(found, index)
			}
		}
	}
	if len(found) != 1 || found[0] != 0 {
		return nestiaCoreMcpRouteParam{}, fmt.Errorf("@McpRoute method %q must decorate its only parameter with @McpRoute.Params()", methodName)
	}
	param := decl.Parameters.Nodes[0]
	typ := prog.Checker.GetTypeAtLocation(param)
	if typ == nil {
		return nestiaCoreMcpRouteParam{}, fmt.Errorf("@McpRoute method %q parameter type could not be resolved", methodName)
	}
	return nestiaCoreMcpRouteParam{index: 0, typ: typ}, nil
}

func nestiaCoreMcpMethodName(method *shimast.Node) string {
	if method == nil || method.Kind != shimast.KindMethodDeclaration {
		return ""
	}
	name := method.AsMethodDeclaration().Name()
	return nestiaCorePropertyNameText(name)
}

func nestiaCoreAnalyzeMcpParameters(prog *driver.Program, typ *shimchecker.Type) *schemametadata.MetadataSchema {
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
				return nativellm.LlmParametersProgrammer.Validate(struct {
					Config   map[string]any
					Metadata *schemametadata.MetadataSchema
					Explore  nativefactories.MetadataFactory_IExplore
				}{
					Config:   nestiaCoreMcpLlmConfig(),
					Metadata: next.Metadata,
					Explore:  next.Explore,
				})
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
			Code:   "@nestia.core.McpRoute.Params",
			Errors: nestiaCoreMetadataErrors(result.Errors),
		}))
	}
	return result.Data
}

func nestiaCoreAnalyzeMcpReturn(prog *driver.Program, typ *shimchecker.Type) {
	if nestiaCoreMcpIsVoidLikeReturn(typ) {
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
				errors := []string{}
				if next.Metadata == next.Top {
					errors = append(errors, nestiaCoreValidateMcpObjectMetadata("return", next.Metadata)...)
				}
				errors = append(errors, nativellm.LlmSchemaProgrammer.Validate(struct {
					Config   map[string]any
					Metadata *schemametadata.MetadataSchema
					Explore  nativefactories.MetadataFactory_IExplore
				}{
					Config:   nestiaCoreMcpLlmConfig(),
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
			Code:   "@nestia.core.McpRoute",
			Errors: nestiaCoreMetadataErrors(result.Errors),
		}))
	}
}

func nestiaCoreMcpIsVoidLikeReturn(typ *shimchecker.Type) bool {
	if typ == nil {
		return true
	}
	if typ.Flags()&shimchecker.TypeFlagsNever != 0 {
		return true
	}
	if typ.Flags()&(shimchecker.TypeFlagsVoid|shimchecker.TypeFlagsUndefined) != 0 {
		return true
	}
	if typ.Flags()&shimchecker.TypeFlagsUnion == 0 {
		return false
	}
	hasVoid := false
	hasValue := false
	for _, elem := range typ.AsUnionOrIntersectionType().Types() {
		if elem.Flags()&shimchecker.TypeFlagsNever != 0 {
			continue
		}
		if elem.Flags()&(shimchecker.TypeFlagsVoid|shimchecker.TypeFlagsUndefined) != 0 {
			hasVoid = true
		} else {
			hasValue = true
		}
	}
	if hasVoid && hasValue {
		panic(nativecontext.NewTransformerError(nativecontext.TransformerError_IProps{
			Code:    "@nestia.core.McpRoute",
			Message: "MCP route return type must not mix void/undefined with structured output.",
		}))
	}
	return hasVoid && !hasValue
}

func nestiaCoreValidateMcpObjectMetadata(label string, metadata *schemametadata.MetadataSchema) []string {
	if metadata == nil {
		return []string{fmt.Sprintf("MCP %s type must be an object type or void.", label)}
	}
	errors := []string{}
	if len(metadata.Objects) == 0 || len(metadata.Objects) != 1 || metadata.Size() > 1 {
		errors = append(errors, fmt.Sprintf("MCP %s type must be a single object type or void.", label))
	}
	for _, object := range metadata.Objects {
		if object == nil || object.Type == nil {
			continue
		}
		for _, property := range object.Type.Properties {
			if property != nil && property.Key != nil && property.Key.IsSoleLiteral() == false {
				errors = append(errors, fmt.Sprintf("MCP %s type must not have dynamic keys.", label))
				break
			}
		}
	}
	if metadata.Nullable {
		errors = append(errors, fmt.Sprintf("MCP %s type must be non-nullable.", label))
	}
	if metadata.IsRequired() == false {
		errors = append(errors, fmt.Sprintf("MCP %s type must be non-undefined.", label))
	}
	return errors
}

func nestiaCoreMcpLlmConfig() map[string]any {
	return map[string]any{"strict": false}
}

type nestiaCoreMcpRouteDoc struct {
	Description string
	Title       string
}

func nestiaCoreMcpRouteJSDoc(file *shimast.SourceFile, method *shimast.Node) nestiaCoreMcpRouteDoc {
	doc := nestiaCoreMcpRouteDoc{}
	source, ok := SourceFileText(file)
	if ok == false || method == nil {
		return doc
	}
	comment := nestiaCoreMcpLeadingJSDoc(source, method)
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
			name, body := nestiaCoreMcpParseJSDocTag(text)
			if name == "title" {
				doc.Title = strings.TrimSpace(body)
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

func nestiaCoreMcpLeadingJSDoc(source string, method *shimast.Node) string {
	positions := []int{method.Pos()}
	if decorators := method.Decorators(); len(decorators) != 0 {
		positions = append(positions, decorators[0].Pos())
	}
	for _, pos := range positions {
		if pos < 0 || pos > len(source) {
			continue
		}
		if comment := nestiaCoreMcpJSDocAtOrBefore(source, pos); comment != "" {
			return comment
		}
	}
	return ""
}

func nestiaCoreMcpJSDocAtOrBefore(source string, pos int) string {
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

func nestiaCoreMcpParseJSDocTag(text string) (string, string) {
	text = strings.TrimPrefix(strings.TrimSpace(text), "@")
	name := text
	body := ""
	if index := strings.IndexAny(text, " \t"); index >= 0 {
		name = text[:index]
		body = strings.TrimSpace(text[index+1:])
	}
	return name, body
}
