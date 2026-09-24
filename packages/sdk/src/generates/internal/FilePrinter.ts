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

export namespace FilePrinter {
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

  export const enter = () =>
    factory.createExpressionStatement(factory.createIdentifier("\n"));

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
