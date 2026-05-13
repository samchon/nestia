import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createPropertySignature(
  modifiers: readonly Node[] | undefined,
  name: string | Node,
  questionToken: Node | undefined,
  type: Node | undefined,
): Node {
  return createNode(SyntaxKind.PropertySignature, {
    modifiers: modifiers ? createNodeArray(modifiers) : undefined,
    name: asName(name),
    questionToken,
    type,
    jsDoc: undefined,
  });
}
