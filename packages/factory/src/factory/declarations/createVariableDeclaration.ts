import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";

export function createVariableDeclaration(
  name: string | Node,
  exclamationToken?: Node,
  type?: Node,
  initializer?: Node,
): Node {
  return createNode(SyntaxKind.VariableDeclaration, {
    name: asName(name),
    exclamationToken,
    type,
    initializer,
  });
}
