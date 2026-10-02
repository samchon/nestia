package transform

import (
	shimast "github.com/microsoft/typescript-go/shim/ast"
)

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
			conditional.ColonToken = factory.NewToken(shimast.KindColonToken)
		}
	}
	node.ForEachChild(func(child *shimast.Node) bool {
		normalizeNestiaSyntheticTokens(child)
		return false
	})
}
