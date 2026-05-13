import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createBlock(
  statements: readonly Node[] = [],
  multiLine?: boolean,
): Node {
  return createNode(SyntaxKind.Block, {
    statements: createNodeArray(statements),
    multiLine: !!multiLine,
  });
}
