import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asModuleSpecifier } from "../../utils/asModuleSpecifier";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createExportDeclaration(
  modifiers: readonly Node[] | undefined,
  isTypeOnly: boolean,
  exportClause: Node | undefined,
  moduleSpecifier?: string | Node,
  attributes?: Node,
): Node {
  return createNode(SyntaxKind.ExportDeclaration, {
    modifiers: modifiers ? createNodeArray(modifiers) : undefined,
    isTypeOnly,
    exportClause,
    moduleSpecifier:
      moduleSpecifier === undefined
        ? undefined
        : asModuleSpecifier(moduleSpecifier),
    assertClause: undefined,
    attributes,
    jsDoc: undefined,
  });
}
