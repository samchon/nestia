import { createToken } from "../factory/tokens/createToken";
import type { Node } from "../structures/Node";

export const asToken = (input: number | Node | undefined): Node | undefined =>
  typeof input === "number" ? createToken(input) : input;
