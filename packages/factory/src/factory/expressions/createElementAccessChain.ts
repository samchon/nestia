import { NodeFlags } from "../../constants/NodeFlags";
import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createToken } from "../tokens/createToken";
import { createElementAccessExpression } from "./createElementAccessExpression";

export function createElementAccessChain(
  expression: Node,
  questionDotToken: Node | undefined,
  argumentExpression: Node,
): Node {
  return {
    ...createElementAccessExpression(expression, argumentExpression),
    flags: NodeFlags.Synthesized | NodeFlags.OptionalChain,
    questionDotToken:
      questionDotToken ?? createToken(SyntaxKind.QuestionDotToken),
    transformFlags: 32,
  };
}
