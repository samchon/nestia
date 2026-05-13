import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createTemplateSpan(expression: Node, literal: Node): Node {
  return createNode(SyntaxKind.TemplateSpan, { expression, literal });
}
