import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createIndexSignature(
  modifiers: readonly Node[] | undefined,
  parameters: readonly Node[],
  type: Node,
): Node {
  return createNode(SyntaxKind.IndexSignature, {
    modifiers: modifiers ? createNodeArray(modifiers) : undefined,
    parameters: createNodeArray(parameters),
    type,
  });
}
