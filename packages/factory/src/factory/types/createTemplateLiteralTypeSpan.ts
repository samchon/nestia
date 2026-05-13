import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createTemplateLiteralTypeSpan(type: Node, literal: Node): Node {
  return createNode(SyntaxKind.TemplateLiteralTypeSpan, { type, literal });
}
