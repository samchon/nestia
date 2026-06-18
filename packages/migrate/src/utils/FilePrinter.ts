import {
  SyntaxKind,
  TsPrinter,
  addSyntheticLeadingComment,
  factory,
} from "@ttsc/factory";

import ts from "../internal/ts";

export namespace FilePrinter {
  export const description = <Node extends ts.Node>(
    node: Node,
    comment: string,
  ): Node => {
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
    statements: ts.Statement[];
    top?: string;
  }): string =>
    (props.top ?? "") + new TsPrinter().printFile(undefined, props.statements);
}
