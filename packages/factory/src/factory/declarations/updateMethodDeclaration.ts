import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNodeArray } from "../../utils/createNodeArray";

export function updateMethodDeclaration(
  original: Node,
  modifiers: readonly Node[] | undefined,
  asteriskToken: Node | undefined,
  name: string | Node,
  questionToken: Node | undefined,
  typeParameters: readonly Node[] | undefined,
  parameters: readonly Node[],
  type: Node | undefined,
  body: Node | undefined,
): Node {
  return {
    ...original,
    modifiers: modifiers ? createNodeArray(modifiers) : undefined,
    asteriskToken,
    name: asName(name),
    questionToken,
    typeParameters: typeParameters
      ? createNodeArray(typeParameters)
      : undefined,
    parameters: createNodeArray(parameters),
    type,
    body,
  };
}
