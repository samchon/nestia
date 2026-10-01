package transform

import (
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
)

// NodeName returns the trimmed identifier text of a named AST node
// (method, parameter, ...). Empty when the node has no name. A name that is no
// identifier, a destructured parameter's `{ a }` or a computed method name's
// `[key]`, reads as its source, since typescript-go's `Text()` panics on it.
//
// @evidence contracts/common.md#principled-implementation The identifier text is read through the shim's `NodeText` so that a destructured parameter or a computed method name, whose `Text()` panics in the compiler port, reads as its source, and the quotes of a string-literal name are trimmed.
// @evidence contracts/common.md#clear-and-simple-design One function with a nil check, one call, and one trim.
// @evidence contracts/common.md#prohibited-implementation-shortcuts It handles the node kinds the compiler API defines, with no fixture names.
// @evidence contracts/common.md#meaningful-documentation The comment states the empty result, the source fallback for non-identifiers, and the reason.
func NodeName(node *shimast.Node) string {
	if node == nil || node.Name() == nil {
		return ""
	}
	return strings.Trim(shimast.NodeText(node.Name()), "\"'")
}

// NodeText returns the verbatim source slice spanned by a node.
//
// @evidence contracts/common.md#principled-implementation The node's position range is applied to the source text of its file after a bounds check, and the slice is trimmed, so a synthesized node or a range outside the source returns an empty string instead of panicking.
// @evidence contracts/common.md#clear-and-simple-design One function over the source text accessor.
// @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the text of the file the node belongs to and adds nothing to it.
// @evidence contracts/common.md#meaningful-documentation The comment states that it returns the verbatim source slice of the node.
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
