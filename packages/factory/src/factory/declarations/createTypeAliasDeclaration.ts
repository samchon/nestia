import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createTypeAliasDeclaration(
  modifiers: readonly Node[] | undefined,
  name: string | Node,
  typeParameters: readonly Node[] | undefined,
  type: Node,
): Node {
  return createNode(SyntaxKind.TypeAliasDeclaration, {
    modifiers: modifiers ? createNodeArray(modifiers) : undefined,
    name: asName(name),
    typeParameters: typeParameters
      ? createNodeArray(typeParameters)
      : undefined,
    type,
    jsDoc: undefined,
    locals: undefined,
    nextContainer: undefined,
  });
}
