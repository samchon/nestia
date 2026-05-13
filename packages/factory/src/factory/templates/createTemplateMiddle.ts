import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createTemplateMiddle(text: string, rawText = text): Node {
  return createNode(SyntaxKind.TemplateMiddle, { text, rawText });
}
