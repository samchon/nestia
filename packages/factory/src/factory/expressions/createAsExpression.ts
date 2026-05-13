import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createAsExpression(expression: Node, type: Node): Node {
  return createNode(SyntaxKind.AsExpression, {
    expression,
    type,
    transformFlags: 1,
  });
}
