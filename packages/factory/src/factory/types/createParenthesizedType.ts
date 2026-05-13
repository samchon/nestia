import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createParenthesizedType(type: Node): Node {
  return createNode(SyntaxKind.ParenthesizedType, { type });
}
