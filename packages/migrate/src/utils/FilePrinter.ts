import ts from "typescript";

export namespace FilePrinter {
  export const description = <Node extends ts.Node>(
    node: Node,
    comment: string,
  ): Node => {
    if (comment.length === 0) return node;
    ts.addSyntheticLeadingComment(
      node,
      ts.SyntaxKind.MultiLineCommentTrivia,
      ["*", ...comment.split("\n").map((str) => ` * ${str}`), ""].join("\n"),
      true,
    );
    return node;
  };

  export const newLine = () =>
    ts.factory.createExpressionStatement(ts.factory.createIdentifier("\n"));

  export const write = (props: {
    statements: ts.Statement[];
    top?: string;
  }): string => {
    const script: string = ts
      .createPrinter()
      .printFile(
        ts.factory.createSourceFile(
          props.statements,
          ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
          ts.NodeFlags.None,
        ),
      );
    return (props.top ?? "") + script;
  };
}
