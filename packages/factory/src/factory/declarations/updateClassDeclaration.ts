import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNodeArray } from "../../utils/createNodeArray";

export function updateClassDeclaration(
  original: Node,
  modifiers: readonly Node[] | undefined,
  name: string | Node | undefined,
  typeParameters: readonly Node[] | undefined,
  heritageClauses: readonly Node[] | undefined,
  members: readonly Node[],
): Node {
  return {
    ...original,
    modifiers: modifiers ? createNodeArray(modifiers) : undefined,
    name: name === undefined ? undefined : asName(name),
    typeParameters: typeParameters
      ? createNodeArray(typeParameters)
      : undefined,
    heritageClauses: heritageClauses
      ? createNodeArray(heritageClauses)
      : undefined,
    members: createNodeArray(members),
  };
}
