import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";

export function createImportClause(
  isTypeOnly: boolean,
  name: string | Node | undefined,
  namedBindings?: Node,
): Node {
  return createNode(SyntaxKind.ImportClause, {
    isTypeOnly,
    name: name === undefined ? undefined : asName(name),
    namedBindings,
  });
}
