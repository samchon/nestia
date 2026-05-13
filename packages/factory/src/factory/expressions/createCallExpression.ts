import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createCallExpression(
  expression: Node,
  typeArguments?: readonly Node[],
  args?: readonly Node[],
): Node {
  return createNode(SyntaxKind.CallExpression, {
    expression,
    questionDotToken: undefined,
    typeArguments: typeArguments ? createNodeArray(typeArguments) : undefined,
    arguments: createNodeArray(args),
  });
}
