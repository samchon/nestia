import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createTupleTypeNode(elements: readonly Node[] = []): Node {
  return createNode(SyntaxKind.TupleType, {
    elements: createNodeArray(elements),
  });
}
