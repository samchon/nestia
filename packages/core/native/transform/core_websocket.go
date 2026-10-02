package transform

import (
	"fmt"

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
//
// @evidence contracts/common.md#principled-implementation A parameter that has exactly one decorator, a call whose callee ends in `WebSocketRoute.<Category>`, reports that category name, and any other parameter reports the empty string.
// @evidence contracts/common.md#clear-and-simple-design An exported wrapper over the private classifier so that the SDK contributor and the core transform share one definition.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The rule is structural, and no parameter name is special-cased.
// @evidence contracts/common.md#meaningful-documentation The comment gives examples of the categories and the empty result.
// @evidence contracts/portability.md#os-neutral-implementation Resolved decorator ownership delegates native package paths to SourceFilePackageName; returned category names are protocol metadata.
// @evidence contracts/performance.md#efficient-algorithms Exactly-one-decorator checks are constant; classification also builds a file import context and resolves declaration ownership.
// @evidenceExclude contracts/performance.md#reuse-equivalent-work This operation does not coordinate equivalent requests; its result is derived from the supplied value or the current command and compiler program.
// @evidence contracts/performance.md#bound-retention-and-release-resources Context maps are local and returned category text refers to compiler data; no cross-program storage is created.
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
// through renamed imports, import types, and type aliases to the tgrid type
// reference it spells, such as `WebSocketAcceptor<Header, Provider, Listener>`
// or `Driver<Listener>`, so the transform and the SDK accept every spelling of
// the same type and still reject another type of the same name. It returns the
// type references it passed, each a type reference or an import type such as
// `import("tgrid").Driver<Listener>`, from the annotation to the tgrid
// reference, each after the first written in the type alias the one before it
// names, and the name tgrid declares the type by; or nil and "" when the
// annotation leads to no tgrid type.
//
// @evidence contracts/common.md#principled-implementation The annotation is followed through parentheses, import aliases, and type aliases, with each step recorded, until a declaration of the `tgrid` package is reached, and the walk is capped at 32 steps so a cyclic alias cannot loop; the chain and the name tgrid declares are returned, so every spelling of the same type is accepted and a type of the same name from another package is rejected.
// @evidence contracts/common.md#clear-and-simple-design One loop with a depth guard, built on private helpers for the reference name and the tgrid declaration test.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The type is identified by its resolved declaration, not by its spelling, which is the point of the function.
// @evidence contracts/common.md#meaningful-documentation The comment states the spellings followed, what the chain contains, and the nil result.
// @evidence contracts/portability.md#os-neutral-implementation tgrid provenance delegates nearest-manifest reads to SourceFilePackageName and the program filesystem instead of deriving package identity from directory spelling.
// @evidence contracts/performance.md#efficient-algorithms The alias walk is capped at 32 steps; each step resolves a symbol and scans declarations, including package ancestor walks for ownership.
// @evidenceExclude contracts/performance.md#reuse-equivalent-work This operation does not coordinate equivalent requests; its result is derived from the supplied value or the current command and compiler program.
// @evidence contracts/performance.md#bound-retention-and-release-resources The chain holds at most 32 node references and is returned to the caller; no global alias graph is retained.
func NestiaCoreWebSocketTypeReference(prog *driver.Program, node *shimast.Node) ([]*shimast.Node, string) {
	chain := []*shimast.Node{}
	for depth := 0; node != nil && depth < 32; depth++ {
		if node.Kind == shimast.KindParenthesizedType {
			node = node.AsParenthesizedTypeNode().Type
			continue
		}
		name := nestiaCoreTypeReferenceName(node)
		if name == nil || prog == nil || prog.Checker == nil {
			return nil, ""
		}
		chain = append(chain, node)
		symbol := prog.Checker.GetSymbolAtLocation(name)
		if symbol != nil && symbol.Flags&shimast.SymbolFlagsAlias != 0 {
			if aliased := shimchecker.Checker_getAliasedSymbol(prog.Checker, symbol); aliased != nil {
				symbol = aliased
			}
		}
		if symbol == nil {
			return nil, ""
		}
		if nestiaCoreIsTgridDeclarations(prog, symbol.Declarations) {
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

// nestiaCoreTypeReferenceName is the entity a type names: the `A.B` of
// `A.B<T>`, or the qualifier of an import type such as `import("m").A.B<T>`.
// It is nil for any other type, including `typeof import("m")`, the type of a
// module's value.
func nestiaCoreTypeReferenceName(node *shimast.Node) *shimast.Node {
	switch node.Kind {
	case shimast.KindTypeReference:
		return node.AsTypeReferenceNode().TypeName
	case shimast.KindImportType:
		if node.AsImportTypeNode().IsTypeOf {
			return nil
		}
		return node.AsImportTypeNode().Qualifier
	}
	return nil
}

func nestiaCoreIsTgridDeclarations(prog *driver.Program, declarations []*shimast.Node) bool {
	for _, declaration := range declarations {
		source := shimast.GetSourceFileOfNode(declaration)
		if source != nil && SourceFilePackageName(prog, source) == "tgrid" {
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
			// the first token's position: Pos() starts at the leading trivia,
			// the previous line's end and any JSDoc
			if pos := shimscanner.GetTokenPosOfNode(node, file, false); pos >= 0 {
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
