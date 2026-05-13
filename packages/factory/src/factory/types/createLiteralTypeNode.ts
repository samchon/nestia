import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createLiteralTypeNode(literal: Node): Node {
  return createNode(SyntaxKind.LiteralType, { literal });
}
