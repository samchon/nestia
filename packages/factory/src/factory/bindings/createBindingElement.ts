import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";

export function createBindingElement(
  dotDotDotToken: Node | undefined,
  propertyName: string | Node | undefined,
  name: string | Node,
  initializer?: Node,
): Node {
  return createNode(SyntaxKind.BindingElement, {
    dotDotDotToken,
    propertyName: propertyName === undefined ? undefined : asName(propertyName),
    name: asName(name),
    initializer,
  });
}
