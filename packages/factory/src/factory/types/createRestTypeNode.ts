import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createRestTypeNode(type: Node): Node {
  return createNode(SyntaxKind.RestType, { type });
}
