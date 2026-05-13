import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createThrowStatement(expression: Node): Node {
  return createNode(SyntaxKind.ThrowStatement, { expression });
}
