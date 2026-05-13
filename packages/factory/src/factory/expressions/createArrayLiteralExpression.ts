import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createArrayLiteralExpression(
  elements: readonly Node[] = [],
  multiLine?: boolean,
): Node {
  return createNode(SyntaxKind.ArrayLiteralExpression, {
    elements: createNodeArray(elements),
    multiLine: !!multiLine,
  });
}
