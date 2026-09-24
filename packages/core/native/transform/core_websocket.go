package transform

import (
	"fmt"
	"path/filepath"
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimchecker "github.com/microsoft/typescript-go/shim/checker"
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
			if _, target := NestiaCoreWebSocketTypeReference(prog, nestiaCoreWebSocketParameterTypeNode(param)); target != "WebSocketAcceptor" {
				diagnostics = append(diagnostics, nestiaCoreWebSocketDiagnostic(context.file, param, "WebSocketRoute", fmt.Sprintf(
					"parameter %q must have WebSocketAcceptor<Header, Provider, Listener> type.",
					name,
				)))
			}
		case "Driver":
			if _, target := NestiaCoreWebSocketTypeReference(prog, nestiaCoreWebSocketParameterTypeNode(param)); target != "Driver" {
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

// NestiaCoreWebSocketParameterCategory names the WebSocketRoute parameter
// decorator on a parameter, such as "Acceptor" or "Driver", or "" for none.
func NestiaCoreWebSocketParameterCategory(prog *driver.Program, param *shimast.Node) string {
	return nestiaCoreWebSocketParameterCategory(prog, param)
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

func nestiaCoreWebSocketParameterTypeNode(param *shimast.Node) *shimast.Node {
	if param == nil || param.AsParameterDeclaration() == nil {
		return nil
	}
	return param.AsParameterDeclaration().Type
}

// NestiaCoreWebSocketTypeReference follows a parameter's type annotation
// through renamed imports and type aliases to the tgrid type reference it
// spells, such as `WebSocketAcceptor<Header, Provider, Listener>` or
// `Driver<Listener>`, so the transform and the SDK accept every spelling of the
// same type and still reject another type of the same name. It returns the
// type references it passed, from the annotation to the tgrid reference, each
// after the first written in the type alias the one before it names, and the
// name tgrid declares the type by; or nil and "" when the annotation leads to
// no tgrid type.
func NestiaCoreWebSocketTypeReference(prog *driver.Program, node *shimast.Node) ([]*shimast.Node, string) {
	chain := []*shimast.Node{}
	for depth := 0; node != nil && depth < 32; depth++ {
		if node.Kind == shimast.KindParenthesizedType {
			node = node.AsParenthesizedTypeNode().Type
			continue
		}
		if node.Kind != shimast.KindTypeReference || prog == nil || prog.Checker == nil {
			return nil, ""
		}
		chain = append(chain, node)
		symbol := prog.Checker.GetSymbolAtLocation(node.AsTypeReferenceNode().TypeName)
		if symbol != nil && symbol.Flags&shimast.SymbolFlagsAlias != 0 {
			if aliased := shimchecker.Checker_getAliasedSymbol(prog.Checker, symbol); aliased != nil {
				symbol = aliased
			}
		}
		if symbol == nil {
			return nil, ""
		}
		if nestiaCoreIsTgridDeclarations(symbol.Declarations) {
			return chain, symbol.Name
		}
		if symbol.Flags&shimast.SymbolFlagsTypeAlias == 0 {
			return nil, ""
		}
		var alias *shimast.Node
		for _, declaration := range symbol.Declarations {
			if declaration != nil && declaration.Kind == shimast.KindTypeAliasDeclaration {
				alias = declaration
				break
			}
		}
		if alias == nil {
			return nil, ""
		}
		node = alias.AsTypeAliasDeclaration().Type
	}
	return nil, ""
}

func nestiaCoreIsTgridDeclarations(declarations []*shimast.Node) bool {
	for _, declaration := range declarations {
		source := shimast.GetSourceFileOfNode(declaration)
		if source != nil && strings.Contains(filepath.ToSlash(source.FileName()), "/tgrid/") {
			return true
		}
	}
	return false
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
