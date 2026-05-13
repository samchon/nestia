import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";
import { createToken } from "../tokens/createToken";

export function createArrowFunction(
  modifiers: readonly Node[] | undefined,
  typeParameters: readonly Node[] | undefined,
  parameters: readonly Node[],
  type: Node | undefined,
  equalsGreaterThanToken: Node | undefined,
  body: Node,
): Node {
  return createNode(SyntaxKind.ArrowFunction, {
    modifiers: modifiers ? createNodeArray(modifiers) : undefined,
    typeParameters: typeParameters
      ? createNodeArray(typeParameters)
      : undefined,
    parameters: createNodeArray(parameters),
    type,
    equalsGreaterThanToken:
      equalsGreaterThanToken ?? createToken(SyntaxKind.EqualsGreaterThanToken),
    body,
    typeArguments: undefined,
    jsDoc: undefined,
    locals: undefined,
    nextContainer: undefined,
    endFlowNode: undefined,
    returnFlowNode: undefined,
  });
}
