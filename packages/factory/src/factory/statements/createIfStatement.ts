import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createIfStatement(
  expression: Node,
  thenStatement: Node,
  elseStatement?: Node,
): Node {
  return createNode(SyntaxKind.IfStatement, {
    expression,
    thenStatement,
    elseStatement,
  });
}
