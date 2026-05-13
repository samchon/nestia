import type { Node } from "./Node";

export type NodeProps = Partial<Node> & Record<string, unknown>;
