import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createAwaitExpression(expression: Node): Node {
  return createNode(SyntaxKind.AwaitExpression, {
    expression,
    transformFlags: 32,
  });
}
