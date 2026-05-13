import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createVariableStatement(
  modifiers: readonly Node[] | undefined,
  declarationList: Node,
): Node {
  return createNode(SyntaxKind.VariableStatement, {
    modifiers: modifiers ? createNodeArray(modifiers) : undefined,
    declarationList,
    jsDoc: undefined,
  });
}
