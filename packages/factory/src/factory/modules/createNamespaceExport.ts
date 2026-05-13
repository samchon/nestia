import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";

export function createNamespaceExport(name: string | Node): Node {
  return createNode(SyntaxKind.NamespaceExport, { name: asName(name) });
}
