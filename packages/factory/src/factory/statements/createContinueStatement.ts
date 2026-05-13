import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";

export function createContinueStatement(label?: string | Node): Node {
  return createNode(SyntaxKind.ContinueStatement, {
    label: label === undefined ? undefined : asName(label),
  });
}
