import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createNewExpression(
  expression: Node,
  typeArguments?: readonly Node[],
  args?: readonly Node[],
): Node {
  return createNode(SyntaxKind.NewExpression, {
    expression,
    typeArguments: typeArguments ? createNodeArray(typeArguments) : undefined,
    arguments: args ? createNodeArray(args) : undefined,
  });
}
