import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createMethodDeclaration(
  modifiers: readonly Node[] | undefined,
  asteriskToken: Node | undefined,
  name: string | Node,
  questionToken: Node | undefined,
  typeParameters: readonly Node[] | undefined,
  parameters: readonly Node[],
  type: Node | undefined,
  body: Node | undefined,
): Node {
  return createNode(SyntaxKind.MethodDeclaration, {
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
    typeArguments: undefined,
    jsDoc: undefined,
    locals: undefined,
    nextContainer: undefined,
    endFlowNode: undefined,
    returnFlowNode: undefined,
  });
}
