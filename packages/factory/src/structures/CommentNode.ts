export interface CommentNode {
  readonly kind: number;
  readonly text: string;
  readonly hasTrailingNewLine?: boolean;
  readonly pos?: number;
  readonly end?: number;
}
