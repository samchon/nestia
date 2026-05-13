import type { CommentNode } from "./CommentNode";

export interface EmitNode {
  leadingComments?: CommentNode[];
  trailingComments?: CommentNode[];
}
