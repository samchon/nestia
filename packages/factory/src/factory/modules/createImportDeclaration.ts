import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asModuleSpecifier } from "../../utils/asModuleSpecifier";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createImportDeclaration(
  modifiers: readonly Node[] | undefined,
  importClause: Node | undefined,
  moduleSpecifier: string | Node,
  attributes?: Node,
): Node {
  return createNode(SyntaxKind.ImportDeclaration, {
    modifiers: modifiers ? createNodeArray(modifiers) : undefined,
    importClause,
    moduleSpecifier: asModuleSpecifier(moduleSpecifier),
    assertClause: undefined,
    attributes,
    jsDoc: undefined,
  });
}
