import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createModifier(kind: number): Node {
  return createNode(kind);
}
