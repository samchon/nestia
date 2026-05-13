import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createClassDeclaration(
  modifiers: readonly Node[] | undefined,
  name: string | Node | undefined,
  typeParameters: readonly Node[] | undefined,
  heritageClauses: readonly Node[] | undefined,
  members: readonly Node[] = [],
): Node {
  return createNode(SyntaxKind.ClassDeclaration, {
    modifiers: modifiers ? createNodeArray(modifiers) : undefined,
    name: name === undefined ? undefined : asName(name),
    typeParameters: typeParameters
      ? createNodeArray(typeParameters)
      : undefined,
    heritageClauses: heritageClauses
      ? createNodeArray(heritageClauses)
      : undefined,
    members: createNodeArray(members),
    jsDoc: undefined,
    locals: undefined,
    nextContainer: undefined,
    endFlowNode: undefined,
  });
}
