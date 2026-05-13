import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createNumericLiteral(value: string | number): Node {
  return createNode(SyntaxKind.NumericLiteral, {
    text: String(value),
    numericLiteralFlags: 0,
  });
}
