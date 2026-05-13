import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createToken } from "../tokens/createToken";

export function createConditionalExpression(
  condition: Node,
  questionToken: Node | undefined,
  whenTrue: Node,
  colonToken: Node | undefined,
  whenFalse: Node,
): Node {
  return createNode(SyntaxKind.ConditionalExpression, {
    condition,
    questionToken: questionToken ?? createToken(SyntaxKind.QuestionToken),
    whenTrue,
    colonToken: colonToken ?? createToken(SyntaxKind.ColonToken),
    whenFalse,
  });
}
