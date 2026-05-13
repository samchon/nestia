import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createForOfStatement(
  awaitModifier: Node | undefined,
  initializer: Node,
  expression: Node,
  statement: Node,
): Node {
  return createNode(SyntaxKind.ForOfStatement, {
    awaitModifier,
    initializer,
    expression,
    statement,
  });
}
