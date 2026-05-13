import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asToken } from "../../utils/asToken";
import { createNode } from "../../utils/createNode";

export function createBinaryExpression(
  left: Node,
  operator: Node | number,
  right: Node,
): Node {
  return createNode(SyntaxKind.BinaryExpression, {
    left,
    operatorToken: asToken(operator),
    right,
  });
}
