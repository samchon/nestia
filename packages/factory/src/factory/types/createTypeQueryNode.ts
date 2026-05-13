import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";

export function createTypeQueryNode(exprName: string | Node): Node {
  return createNode(SyntaxKind.TypeQuery, { exprName: asName(exprName) });
}
