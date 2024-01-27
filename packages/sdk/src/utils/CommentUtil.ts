import ts from "typescript";

export namespace CommentUtil {
  export const newLineBefore = <Node extends ts.Node>(node: Node): Node => {
    ts.addSyntheticLeadingComment(
      node, 
      ts.SyntaxKind.SingleLineCommentTrivia, 
      "", 
      true
    );
    return node;
  }
  export const newLineAfter = <Node extends ts.Node>(node: Node): Node => {
    ts.addSyntheticTrailingComment(
      node, 
      ts.SyntaxKind.SingleLineCommentTrivia, 
      "", 
      true
    );
    return node;
  }

  export const parameters = <Node extends ts.Node>(elements: Node[]): Node[] => {
    elements.forEach(newLineAfter);
    return elements;
  }

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