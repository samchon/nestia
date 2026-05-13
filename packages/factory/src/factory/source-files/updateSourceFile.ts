import type { Node } from "../../structures/Node";
import { createNodeArray } from "../../utils/createNodeArray";

export function updateSourceFile(
  file: Node,
  statements: readonly Node[],
): Node {
  return { ...file, statements: createNodeArray(statements) };
}
