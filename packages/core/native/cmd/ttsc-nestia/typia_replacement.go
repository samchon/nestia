package main

import (
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	typiaadapter "github.com/samchon/typia/packages/typia/native/adapter"
)

func parenthesizeTypiaReplacement(
	site typiaadapter.CallSite,
	expr string,
) string {
	text := strings.TrimSpace(expr)
	if strings.HasPrefix(text, "{") == false {
		return expr
	}
	node := site.Call.AsNode()
	if node == nil || node.Parent == nil ||
		node.Parent.Kind != shimast.KindExpressionStatement {
		return expr
	}
	return "(" + expr + ")"
}
