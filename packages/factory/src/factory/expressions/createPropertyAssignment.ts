import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";

export function createPropertyAssignment(
  name: string | Node,
  initializer: Node,
): Node {
  return createNode(SyntaxKind.PropertyAssignment, {
    name: asName(name),
    initializer,
  });
}
