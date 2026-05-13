import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createTemplateHead(text: string, rawText = text): Node {
  return createNode(SyntaxKind.TemplateHead, { text, rawText });
}
