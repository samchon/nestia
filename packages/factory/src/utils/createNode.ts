import { NodeFlags } from "../constants/NodeFlags";
import type { Node } from "../structures/Node";
import type { NodeProps } from "../structures/NodeProps";

export const createNode = (kind: number, props: NodeProps = {}): Node => ({
  pos: -1,
  end: -1,
  kind,
  flags: NodeFlags.Synthesized,
  modifierFlagsCache: 0,
  transformFlags: 0,
  ...props,
});
