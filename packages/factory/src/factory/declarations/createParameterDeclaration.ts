import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createParameterDeclaration(
  modifiers: readonly Node[] | undefined,
  dotDotDotToken: Node | undefined,
  name: string | Node,
  questionToken?: Node,
  type?: Node,
  initializer?: Node,
): Node {
  return createNode(SyntaxKind.Parameter, {
    modifiers: modifiers ? createNodeArray(modifiers) : undefined,
    dotDotDotToken,
    name: asName(name),
    questionToken,
    type,
    initializer,
    jsDoc: undefined,
  });
}
