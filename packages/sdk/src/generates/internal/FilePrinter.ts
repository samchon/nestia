import fs from "fs";
import { format } from "prettier";
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
          .map((str) => ` * ${str.split("*/").join("*\\\\/")}`),
        "",
      ].join("\n"),
      true,
    );
    return node;
  };

  export const enter = () =>
    ts.factory.createExpressionStatement(ts.factory.createIdentifier("\n"));

  export const write = async (props: {
    location: string;
    statements: ts.Statement[];
    top?: string;
  }): Promise<void> => {
    const script: string = ts
      .createPrinter()
      .printFile(
        ts.factory.createSourceFile(
          props.statements,
          ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
          ts.NodeFlags.None,
        ),
      );
    await fs.promises.writeFile(
      props.location,
      await beautify((props.top ?? "") + script),
      "utf8",
    );
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
