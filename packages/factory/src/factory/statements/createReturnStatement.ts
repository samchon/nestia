import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createReturnStatement(expression?: Node): Node {
  return createNode(SyntaxKind.ReturnStatement, { expression });
}
