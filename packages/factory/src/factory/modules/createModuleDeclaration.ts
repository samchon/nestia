import { NodeFlags } from "../../constants/NodeFlags";
import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { asName } from "../../utils/asName";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";

export function createModuleDeclaration(
  modifiers: readonly Node[] | undefined,
  name: string | Node,
  body?: Node,
  flags = 0,
): Node {
  return createNode(SyntaxKind.ModuleDeclaration, {
    modifiers: modifiers ? createNodeArray(modifiers) : undefined,
    name: asName(name),
    body,
    flags: NodeFlags.Synthesized | flags,
    jsDoc: undefined,
    locals: undefined,
    nextContainer: undefined,
  });
}
