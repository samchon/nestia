import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createBinaryExpression } from "./createBinaryExpression";

export function createStrictEquality(left: Node, right: Node): Node {
  return createBinaryExpression(
    left,
    SyntaxKind.EqualsEqualsEqualsToken,
    right,
  );
}
