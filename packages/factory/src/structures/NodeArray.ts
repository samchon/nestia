import type { Node } from "./Node";

export type NodeArray<T extends Node = Node> = T[] & {
  pos: number;
  end: number;
  hasTrailingComma: boolean;
  transformFlags: number;
};
