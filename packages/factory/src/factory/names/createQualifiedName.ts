import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";

export function createQualifiedName(
  left: string | Node,
  right: string | Node,
): Node {
  return createNode(SyntaxKind.QualifiedName, {
    left: asName(left),
    right: asName(right),
  });
}
