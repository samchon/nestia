import {
  Node,
  SyntaxKind,
  TypeScriptFactory,
  TypeScriptPrinter,
} from "@nestia/factory";
import fs from "fs";
import { format } from "prettier";

export namespace FilePrinter {
  export const description = <T extends Node>(
    node: T,
    comment: string,
  ): T => {
    if (comment.length === 0) return node;
    node.emitNode ??= {};
    node.emitNode.leadingComments = [
      ...(node.emitNode.leadingComments ?? []),
      {
        kind: SyntaxKind.MultiLineCommentTrivia,
        text: [
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
        hasTrailingNewLine: true,
      },
    ];
    return node;
  };

  export const enter = () =>
    TypeScriptFactory.createExpressionStatement(
      TypeScriptFactory.createIdentifier("\n"),
    );

  export const write = async (props: {
    location: string;
    statements: Node[];
    top?: string;
  }): Promise<void> => {
    const script: string = TypeScriptPrinter.write({
      statements: props.statements,
      top: props.top,
    });
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
