import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";

export function createShorthandPropertyAssignment(
  name: string | Node,
  objectAssignmentInitializer?: Node,
): Node {
  return createNode(SyntaxKind.ShorthandPropertyAssignment, {
    name: asName(name),
    objectAssignmentInitializer,
  });
}
