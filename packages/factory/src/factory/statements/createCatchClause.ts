import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createVariableDeclaration } from "../declarations/createVariableDeclaration";

export function createCatchClause(
  variableDeclaration: string | Node | undefined,
  block: Node,
): Node {
  return createNode(SyntaxKind.CatchClause, {
    variableDeclaration:
      typeof variableDeclaration === "string"
        ? createVariableDeclaration(variableDeclaration)
        : variableDeclaration,
    block,
  });
}
