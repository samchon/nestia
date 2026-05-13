import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createPrefixUnaryExpression(
  operator: number,
  operand: Node,
): Node {
  return createNode(SyntaxKind.PrefixUnaryExpression, { operator, operand });
}
