import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createArrayBindingPattern(elements: readonly Node[]): Node {
  return createNode(SyntaxKind.ArrayBindingPattern, {
    elements: createNodeArray(elements),
  });
}
