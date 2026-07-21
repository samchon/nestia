package transform

import (
	shimast "github.com/microsoft/typescript-go/shim/ast"
)

const nestiaKindColonToken = shimast.KindQuestionToken + 1
func normalizeNestiaSyntheticTokens(node *shimast.Node) {
	if node == nil {
		return
	}
	if node.Kind == shimast.KindConditionalExpression {
		conditional := node.AsConditionalExpression()
		factory := shimast.NewNodeFactory(shimast.NodeFactoryHooks{})
		if conditional.QuestionToken == nil {
			conditional.QuestionToken = factory.NewToken(shimast.KindQuestionToken)
		}
		if conditional.ColonToken == nil {
			conditional.ColonToken = factory.NewToken(nestiaKindColonToken)
		}
	}
	node.ForEachChild(func(child *shimast.Node) bool {
		normalizeNestiaSyntheticTokens(child)
		return false
	})
}
