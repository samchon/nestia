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
