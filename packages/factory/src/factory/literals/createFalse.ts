import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createToken } from "../tokens/createToken";

export function createFalse(): Node {
  return createToken(SyntaxKind.FalseKeyword);
}
