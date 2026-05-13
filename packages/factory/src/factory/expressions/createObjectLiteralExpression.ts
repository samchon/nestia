import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createObjectLiteralExpression(
  properties: readonly Node[] = [],
  multiLine?: boolean,
): Node {
  return createNode(SyntaxKind.ObjectLiteralExpression, {
    properties: createNodeArray(properties),
    multiLine: !!multiLine,
  });
}
