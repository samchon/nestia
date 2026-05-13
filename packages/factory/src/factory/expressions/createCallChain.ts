import { NodeFlags } from "../../constants/NodeFlags";
import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createToken } from "../tokens/createToken";
import { createCallExpression } from "./createCallExpression";

export function createCallChain(
  expression: Node,
  questionDotToken?: Node,
  typeArguments?: readonly Node[],
  args?: readonly Node[],
): Node {
  return {
    ...createCallExpression(expression, typeArguments, args),
    flags: NodeFlags.Synthesized | NodeFlags.OptionalChain,
    questionDotToken:
      questionDotToken ?? createToken(SyntaxKind.QuestionDotToken),
    transformFlags: 32,
  };
}
