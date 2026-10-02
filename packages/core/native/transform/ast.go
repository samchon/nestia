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
// @evidenceExclude contracts/portability.md#os-neutral-implementation The compiler node name is source text, not a filesystem path.
// @evidence contracts/performance.md#efficient-algorithms Reading NodeText and trimming quote characters cost at most the name text length.
// @evidenceExclude contracts/performance.md#reuse-equivalent-work This operation does not coordinate equivalent requests; its result is derived from the supplied value or the current command and compiler program.
// @evidence contracts/performance.md#bound-retention-and-release-resources The returned string borrows or contains source text; the helper retains no node globally.
func NodeName(node *shimast.Node) string {
	if node == nil || node.Name() == nil {
		return ""
	}
	return strings.Trim(shimast.NodeText(node.Name()), "\"'")
}

// NodeText returns the source slice spanned by a node with surrounding whitespace removed.
//
// @evidence contracts/common.md#principled-implementation The node's position range is applied to the source text of its file after a bounds check, and the slice is trimmed, so a synthesized node or a range outside the source returns an empty string instead of panicking.
// @evidence contracts/common.md#clear-and-simple-design One function over the source text accessor.
// @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the text of the file the node belongs to and adds nothing to it.
// @evidence contracts/common.md#meaningful-documentation The comment identifies the source range and whitespace trimming.
// @evidenceExclude contracts/portability.md#os-neutral-implementation Source text and node byte offsets are compiler data rather than native filesystem access.
// @evidence contracts/performance.md#efficient-algorithms Bounds checks are constant work and TrimSpace scans at most the selected source range.
// @evidenceExclude contracts/performance.md#reuse-equivalent-work This operation does not coordinate equivalent requests; its result is derived from the supplied value or the current command and compiler program.
// @evidence contracts/performance.md#bound-retention-and-release-resources The returned source substring can keep its source string alive until the caller releases it; no global state or handle is acquired.
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
