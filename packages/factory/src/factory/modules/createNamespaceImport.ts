import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";

export function createNamespaceImport(name: string | Node): Node {
  return createNode(SyntaxKind.NamespaceImport, { name: asName(name) });
}
