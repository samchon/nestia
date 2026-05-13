import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";

export function createDecorator(expression: Node): Node {
  return createNode(SyntaxKind.Decorator, {
    expression,
    transformFlags: 33562624,
  });
}
