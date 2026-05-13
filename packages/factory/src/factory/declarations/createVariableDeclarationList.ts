import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createVariableDeclarationList(
  declarations: readonly Node[],
  flags = 0,
): Node {
  return createNode(SyntaxKind.VariableDeclarationList, {
    flags,
    declarations: createNodeArray(declarations),
  });
}
