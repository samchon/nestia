package transform

import (
	"fmt"
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimscanner "github.com/microsoft/typescript-go/shim/scanner"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

func validateNestiaCoreWebSocketRoute(
	prog *driver.Program,
	context nestiaCoreFileContext,
	method *shimast.Node,
	call *shimast.CallExpression,
	segments []string,
) []Diagnostic {
	if call == nil || len(segments) == 0 || segments[len(segments)-1] != "WebSocketRoute" {
		_ = call
		return nil
	}
	diagnostics := []Diagnostic{}
	accepted := false
	methodDecl := method.AsMethodDeclaration()
	if methodDecl == nil || methodDecl.Parameters == nil {
		return []Diagnostic{nestiaCoreWebSocketDiagnostic(context.file, method, "WebSocketRoute", fmt.Sprintf(
			"method %q must have at least one parameter decorated by @WebSocketRoute.Acceptor().",
			NodeName(method),
		))}
	}
	for _, param := range methodDecl.Parameters.Nodes {
		category := nestiaCoreWebSocketParameterCategory(prog, param)
		name := NodeName(param)
		if category == "" {
			diagnostics = append(diagnostics, nestiaCoreWebSocketDiagnostic(context.file, param, "WebSocketRoute", fmt.Sprintf(
				"parameter %q is not decorated with nested function of WebSocketRoute module.",
				name,
			)))
			continue
		}
		switch category {
		case "Acceptor":
			accepted = true
			if strings.HasPrefix(nestiaCoreWebSocketParameterTypeName(param), "WebSocketAcceptor") == false {
				diagnostics = append(diagnostics, nestiaCoreWebSocketDiagnostic(context.file, param, "WebSocketRoute", fmt.Sprintf(
					"parameter %q must have WebSocketAcceptor<Header, Provider, Listener> type.",
					name,
				)))
			}
		case "Driver":
			if strings.HasPrefix(nestiaCoreWebSocketParameterTypeName(param), "Driver") == false {
				diagnostics = append(diagnostics, nestiaCoreWebSocketDiagnostic(context.file, param, "WebSocketRoute", fmt.Sprintf(
					"parameter %q must have Driver<Listener> type.",
					name,
				)))
			}
		}
	}
	if accepted == false {
		diagnostics = append(diagnostics, nestiaCoreWebSocketDiagnostic(context.file, method, "WebSocketRoute", fmt.Sprintf(
			"method %q must have at least one parameter decorated by @WebSocketRoute.Acceptor().",
			NodeName(method),
		)))
	}
	return diagnostics
}

func nestiaCoreWebSocketParameterCategory(prog *driver.Program, param *shimast.Node) string {
	if param == nil || len(param.Decorators()) != 1 {
		return ""
	}
	call, segments, ok := nestiaCoreDecoratorCall(prog, param.Decorators()[0])
	if ok == false || len(segments) < 2 || segments[len(segments)-2] != "WebSocketRoute" {
		_ = call
		return ""
	}
	return segments[len(segments)-1]
}

func nestiaCoreWebSocketParameterTypeName(param *shimast.Node) string {
	if param == nil || param.AsParameterDeclaration() == nil || param.AsParameterDeclaration().Type == nil {
		return ""
	}
	text := NodeText(param.AsParameterDeclaration().Type)
	text = strings.TrimSpace(text)
	if index := strings.Index(text, "<"); index >= 0 {
		text = text[:index]
	}
	if index := strings.LastIndex(text, "."); index >= 0 {
		text = text[index+1:]
	}
	return text
}

func nestiaCoreWebSocketDiagnostic(file *shimast.SourceFile, node *shimast.Node, kind string, message string) Diagnostic {
	filePath := ""
	line, column := 0, 0
	if file != nil {
		filePath = file.FileName()
		if node != nil {
			if pos := node.Pos(); pos >= 0 {
				l, c := shimscanner.GetECMALineAndByteOffsetOfPosition(file, pos)
				line, column = l+1, c+1
			}
		}
	}
	return Diagnostic{
		File:    filePath,
		Line:    line,
		Column:  column,
		Code:    "nestia.core." + kind,
		Message: message,
	}
}
