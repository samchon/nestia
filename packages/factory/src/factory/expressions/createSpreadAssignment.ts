import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createSpreadAssignment(expression: Node): Node {
  return createNode(SyntaxKind.SpreadAssignment, { expression });
}
