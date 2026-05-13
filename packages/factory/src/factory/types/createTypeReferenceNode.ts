import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createTypeReferenceNode(
  typeName: string | Node,
  typeArguments?: readonly Node[],
): Node {
  return createNode(SyntaxKind.TypeReference, {
    typeName: asName(typeName),
    typeArguments: typeArguments ? createNodeArray(typeArguments) : undefined,
  });
}
