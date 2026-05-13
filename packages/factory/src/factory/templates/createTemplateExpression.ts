import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createTemplateExpression(
  head: Node,
  templateSpans: readonly Node[],
): Node {
  return createNode(SyntaxKind.TemplateExpression, {
    head,
    templateSpans: createNodeArray(templateSpans),
  });
}
