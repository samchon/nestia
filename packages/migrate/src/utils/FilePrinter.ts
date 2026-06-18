import {
  type Node,
  type Statement,
  SyntaxKind,
  TsPrinter,
  addSyntheticLeadingComment,
  factory,
} from "@ttsc/factory";

export namespace FilePrinter {
  export const description = <T extends Node>(node: T, comment: string): T => {
    if (comment.length === 0) return node;
    addSyntheticLeadingComment(
      node,
      SyntaxKind.MultiLineCommentTrivia,
      [
        "*",
        ...comment
          .split("\r\n")
          .join("\n")
          .split("\n")
          .map(
            (str) =>
              ` * ${str.split("*/").join("*\\\\/").split("*\\/").join("*\\\\/")}`,
          ),
        "",
      ].join("\n"),
      true,
    );
    return node;
  };

  export const newLine = () =>
    factory.createExpressionStatement(factory.createIdentifier("\n"));

  export const write = (props: {
    statements: Statement[];
    top?: string;
  }): string => {
    const script: string = new TsPrinter({
      newLine: "\n",
    }).printFile(undefined, props.statements);
    return (props.top ?? "") + script;
  };
}
