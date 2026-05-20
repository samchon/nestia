import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createElementAccessExpression(
  expression: Node,
  argumentExpression: Node,
): Node {
  return createNode(SyntaxKind.ElementAccessExpression, {
    expression,
    questionDotToken: undefined,
    argumentExpression,
    jsDoc: undefined,
    flowNode: undefined,
  });
}
