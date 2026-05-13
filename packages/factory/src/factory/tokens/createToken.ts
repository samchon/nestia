import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createToken(kind: number): Node {
  return createNode(kind);
}
