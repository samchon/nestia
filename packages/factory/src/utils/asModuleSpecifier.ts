import { createStringLiteral } from "../factory/literals/createStringLiteral";
import type { Node } from "../structures/Node";

export const asModuleSpecifier = (input: string | Node): Node =>
  typeof input === "string" ? createStringLiteral(input) : input;
