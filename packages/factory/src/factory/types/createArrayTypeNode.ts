import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createParenthesizedType } from "./createParenthesizedType";

export function createArrayTypeNode(elementType: Node): Node {
  return createNode(SyntaxKind.ArrayType, {
    elementType:
      elementType.kind === SyntaxKind.UnionType ||
      elementType.kind === SyntaxKind.IntersectionType
        ? createParenthesizedType(elementType)
        : elementType,
  });
}
