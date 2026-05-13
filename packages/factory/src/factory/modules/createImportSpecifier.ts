import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";

export function createImportSpecifier(
  isTypeOnly: boolean,
  propertyName: string | Node | undefined,
  name: string | Node,
): Node {
  return createNode(SyntaxKind.ImportSpecifier, {
    isTypeOnly,
    propertyName: propertyName === undefined ? undefined : asName(propertyName),
    name: asName(name),
  });
}
