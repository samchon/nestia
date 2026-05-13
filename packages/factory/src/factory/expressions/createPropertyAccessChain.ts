import { NodeFlags } from "../../constants/NodeFlags";
import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createToken } from "../tokens/createToken";
import { createPropertyAccessExpression } from "./createPropertyAccessExpression";

export function createPropertyAccessChain(
  expression: Node,
  questionDotToken: Node | undefined,
  name: string | Node,
): Node {
  return {
    ...createPropertyAccessExpression(expression, name),
    flags: NodeFlags.Synthesized | NodeFlags.OptionalChain,
    questionDotToken:
      questionDotToken ?? createToken(SyntaxKind.QuestionDotToken),
    transformFlags: 32,
  };
}
