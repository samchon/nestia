import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createKeywordTypeNode(kind: number): Node {
  return createNode(kind);
}
