import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createIdentifier(text: string): Node {
  return createNode(SyntaxKind.Identifier, {
    escapedText: text,
    text,
    jsDoc: undefined,
    flowNode: undefined,
  });
}
