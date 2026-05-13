import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createTryStatement(
  tryBlock: Node,
  catchClause?: Node,
  finallyBlock?: Node,
): Node {
  return createNode(SyntaxKind.TryStatement, {
    tryBlock,
    catchClause,
    finallyBlock,
  });
}
