import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createNamedImports(elements: readonly Node[]): Node {
  return createNode(SyntaxKind.NamedImports, {
    elements: createNodeArray(elements),
  });
}
