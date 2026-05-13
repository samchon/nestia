import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createModuleBlock(statements: readonly Node[] = []): Node {
  return createNode(SyntaxKind.ModuleBlock, {
    statements: createNodeArray(statements),
  });
}
