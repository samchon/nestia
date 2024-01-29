import { format } from "prettier";
import ts from "typescript";

export namespace FormatUtil {
  export const description = <Node extends ts.Node>(
    node: Node,
    comment: string,
  ): Node => {
    if (comment.length === 0) return node;
    ts.addSyntheticLeadingComment(
      node,
      ts.SyntaxKind.MultiLineCommentTrivia,
      ["*", ...comment.split("\n").map((str) => ` * ${str}`), ""].join("\n"),
      true,
    );
    return node;
  };

  export const enter = () =>
    ts.factory.createExpressionStatement(ts.factory.createIdentifier("\n"));

  export const beautify = async (script: string): Promise<string> => {
    try {
      return await format(script, {
        parser: "typescript",
      });
    } catch {
      return script;
    }
  };
}
