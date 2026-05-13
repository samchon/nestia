import { TypeScriptFactory, TypeScriptPrinter } from "@nestia/factory";
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
    TypeScriptFactory.createExpressionStatement(
      TypeScriptFactory.createIdentifier("\n"),
    );

  export const write = (props: {
    statements: ts.Statement[];
    top?: string;
  }): string => {
    return TypeScriptPrinter.write({
      statements: props.statements,
      top: props.top,
      printerOptions: {
        newLine: ts.NewLineKind.LineFeed,
      },
    });
  };
}
