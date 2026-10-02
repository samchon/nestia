import {
  type Node,
  type Statement,
  SyntaxKind,
  TsPrinter,
  addSyntheticLeadingComment,
  factory,
} from "@ttsc/factory";
import fs from "fs";
import { format } from "prettier";

/**
 * Prints generated syntax trees to files.
 *
 * @evidence contracts/common.md#principled-implementation The namespace attaches comments, writes tags, prints statements, and formats the result.
 * @evidence contracts/common.md#clear-and-simple-design Four functions and one private formatter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Formatting failure keeps the unformatted script.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 * @evidence contracts/portability.md#os-neutral-implementation Only write crosses the native filesystem boundary, through fs.promises.writeFile with the caller's location and UTF-8. The other helpers construct language comments and syntax independently of native path identity or separators.
 */
export namespace FilePrinter {
  /**
   * Attaches a comment to a node as a JSDoc block, escaping every comment
   * terminator in it so the comment cannot end early.
   *
   * @evidence contracts/common.md#principled-implementation Each line of the comment becomes one JSDoc line and an empty comment adds nothing.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The closing marker is escaped rather than dropped.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation description attaches language-level comment text to an AST and performs no native filesystem or process operation.
   */
  export const description = <T extends Node>(node: T, comment: string): T => {
    if (comment.length === 0) return node;
    return addSyntheticLeadingComment(
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
  };

  /**
   * Writes a JSDoc tag so TypeScript reads its text back as it is.
   *
   * TypeScript takes a continued line's margin off up to the column the text
   * began at: past `@<head> ` when the text starts on the tag's line, or the
   * tag's own column when it starts on the next one. So a text whose first line
   * is indented, such as an `@example`'s code, starts on the next line, and any
   * other text continues at its first line's column. Either way every line
   * keeps the indentation it has beyond the margin.
   *
   * @param head The tag's name, followed by a `@param` tag's parameter name
   * @param text The tag's text
   * @evidence contracts/common.md#principled-implementation The margin is the width of the head, and a text whose first line is indented starts on the next line.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every line keeps the indentation it has beyond the margin.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation jsDocTag formats TypeScript comment text; indentation and line feeds express language syntax rather than native paths or handles.
   */
  export const jsDocTag = (head: string, text: string): string => {
    const lines: string[] = text.split("\n").map((line) => line.trimEnd());
    while (lines.length !== 0 && lines[0] === "") lines.shift();
    while (lines.length !== 0 && lines.at(-1) === "") lines.pop();
    if (lines.length === 0) return `@${head}`;
    else if (/^\s/.test(lines[0]!)) return [`@${head}`, ...lines].join("\n");
    const margin: string = " ".repeat(head.length + 2);
    return [
      `@${head} ${lines[0]}`,
      ...lines
        .slice(1)
        .map((line) => (line.length ? `${margin}${line}` : line)),
    ].join("\n");
  };

  /**
   * Returns a statement that prints as an empty line.
   *
   * @evidence contracts/common.md#principled-implementation A line break is an identifier statement, which the printer emits between its neighbors.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The printer places the break where it is used.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation enter returns a language AST node and owns no filesystem or process boundary.
   */
  export const enter = () =>
    factory.createExpressionStatement(factory.createIdentifier("\n"));

  /**
   * Prints the statements to the location, prefixed by the optional top text,
   * and formats the script.
   *
   * @evidence contracts/common.md#principled-implementation The script is formatted with Prettier, and the unformatted script is written when the formatter throws, so a formatting failure never loses the file.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The write is awaited and its failure is thrown.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidence contracts/portability.md#os-neutral-implementation writeFile receives the native pathname as a separate argument and writes UTF-8 after formatting. Its caller owns parent-directory creation; write failures propagate on every platform without shell quoting or separator rewriting.
   */
  export const write = async (props: {
    location: string;
    statements: Node[];
    top?: string;
  }): Promise<void> => {
    const script: string =
      (props.top ?? "") +
      new TsPrinter().printFile(undefined, props.statements as Statement[]);
    await fs.promises.writeFile(props.location, await beautify(script), "utf8");
  };

  const beautify = async (script: string): Promise<string> => {
    try {
      return await format(script, {
        parser: "typescript",
      });
    } catch {
      return script;
    }
  };
}
