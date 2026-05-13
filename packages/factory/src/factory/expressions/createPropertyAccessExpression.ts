import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";

export function createPropertyAccessExpression(
  expression: Node,
  name: string | Node,
): Node {
  return createNode(SyntaxKind.PropertyAccessExpression, {
    expression,
    questionDotToken: undefined,
    name: asName(name),
    jsDoc: undefined,
    flowNode: undefined,
  });
}
