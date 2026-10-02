import {
  SyntaxKind,
  TsPrinter,
  addSyntheticLeadingComment,
  factory,
} from "@ttsc/factory";

import ts from "../internal/ts";

/**
 * Helpers that turn statements and comments into file text.
 *
 * @evidence contracts/common.md#principled-implementation The namespace attaches a JSDoc comment to a node, builds a blank line, and prints a file from statements.
 * @evidence contracts/common.md#clear-and-simple-design Three small functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The comment text is escaped so it cannot end the comment early.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace FilePrinter {
  /**
   * Attaches a JSDoc comment made from the text to the node, and leaves the
   * node alone when the text is empty.
   *
   * @evidence contracts/common.md#principled-implementation Line endings are normalized, each line is prefixed, and every comment terminator in the text is replaced by an escaped form, so a description can never end the comment early and inject code.
   * @evidence contracts/common.md#clear-and-simple-design One function with an early return.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The escaping applies to every line.
   * @evidence contracts/common.md#meaningful-documentation The comment states the empty case and the escaping.
   */
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

  /**
   * Builds a statement that prints as a blank line.
   *
   * @evidence contracts/common.md#principled-implementation The printer emits the identifier text as it is, so an identifier holding a newline produces an empty line between statements.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is the way the printer offers to space statements.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the statement prints.
   */
  export const newLine = () =>
    factory.createExpressionStatement(factory.createIdentifier("\n"));

  /**
   * Prints the statements as a file, with an optional text at the top.
   *
   * @evidence contracts/common.md#principled-implementation The statements are printed by the factory package's printer, so the output is the source of the syntax tree.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It prints what it is given.
   * @evidence contracts/common.md#meaningful-documentation The comment states the top text.
   */
  export const write = (props: {
    statements: ts.Statement[];
    top?: string;
  }): string =>
    (props.top ?? "") + new TsPrinter().printFile(undefined, props.statements);
}
