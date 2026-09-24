package transform

import (
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
)

// NodeName returns the trimmed identifier text of a named AST node
// (method, parameter, ...). Empty when the node has no name. A name that is no
// identifier, a destructured parameter's `{ a }` or a computed method name's
// `[key]`, reads as its source, since typescript-go's `Text()` panics on it.
func NodeName(node *shimast.Node) string {
	if node == nil || node.Name() == nil {
		return ""
	}
	return strings.Trim(shimast.NodeText(node.Name()), "\"'")
}

// NodeText returns the verbatim source slice spanned by a node.
func NodeText(node *shimast.Node) string {
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
