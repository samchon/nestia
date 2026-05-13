import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createPrefixUnaryExpression } from "./createPrefixUnaryExpression";

export function createLogicalNot(operand: Node): Node {
  return createPrefixUnaryExpression(SyntaxKind.ExclamationToken, operand);
}
