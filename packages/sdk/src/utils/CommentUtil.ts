import ts from "typescript";

export namespace CommentUtil {
  export const description = <Node extends ts.Node>(
    node: Node, 
    comment: string
  ): Node => {
    ts.addSyntheticLeadingComment(
      node, 
      ts.SyntaxKind.MultiLineCommentTrivia, 
      [
        "*",
        ...comment.split("\n").map((str) => ` * ${str}`),
        "",
      ].join("\n"), 
      true
    );
    return node;
  }
}