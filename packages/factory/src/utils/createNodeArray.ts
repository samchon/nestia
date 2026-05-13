import type { Node } from "../structures/Node";
import type { NodeArray } from "../structures/NodeArray";

export const createNodeArray = <T extends Node>(
  items: readonly T[] | undefined,
): NodeArray<T> => {
  const array: T[] = [...(items ?? [])];
  return Object.assign(array, {
    pos: -1,
    end: -1,
    hasTrailingComma: false,
    transformFlags: 0,
  });
};
