import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createBigIntLiteral(value: string | number | bigint): Node {
  const text: string = String(value).replace(/n$/i, "");
  return createNode(SyntaxKind.BigIntLiteral, { text, transformFlags: 32 });
}
