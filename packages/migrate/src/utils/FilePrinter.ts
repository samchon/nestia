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

  // A blank-line spacer between statements. An empty identifier prints as a
  // single empty line; wrapping it in an `ExpressionStatement` (as the legacy
  // code did) would append a stray `;` at statement level.
  export const newLine = (): Statement =>
    factory.createIdentifier("") as unknown as Statement;

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
