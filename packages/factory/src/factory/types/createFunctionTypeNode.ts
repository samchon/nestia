import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createFunctionTypeNode(
  typeParameters: readonly Node[] | undefined,
  parameters: readonly Node[],
  type: Node,
): Node {
  return createNode(SyntaxKind.FunctionType, {
    typeParameters: typeParameters
      ? createNodeArray(typeParameters)
      : undefined,
    parameters: createNodeArray(parameters),
    type,
  });
}
