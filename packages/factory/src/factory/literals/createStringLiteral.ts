import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createStringLiteral(
  text: string,
  isSingleQuote?: boolean,
): Node {
  return createNode(SyntaxKind.StringLiteral, {
    text,
    singleQuote: isSingleQuote,
    hasExtendedUnicodeEscape: undefined,
  });
}
