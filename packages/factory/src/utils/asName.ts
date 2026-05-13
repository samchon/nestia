import { createIdentifier } from "../factory/literals/createIdentifier";
import type { Node } from "../structures/Node";

export const asName = (input: string | Node): Node =>
  typeof input === "string" ? createIdentifier(input) : input;
