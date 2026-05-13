import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createToken } from "../tokens/createToken";

export function createTrue(): Node {
  return createToken(SyntaxKind.TrueKeyword);
}
