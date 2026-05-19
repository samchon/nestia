// Compatibility shim that replaces `import ts from "./ts"`. The values
// (`ts.factory`, `ts.SyntaxKind`, `ts.NodeFlags`) are routed to @nestia/factory
// so the migration generators run without a `typescript` dependency, while the
// type aliases (`ts.Expression`, `ts.ParameterDeclaration`, …) collapse to the
// shared @nestia/factory `Node` so existing annotations type-check unchanged.
//
// Every alias is intentionally `Node`; the migrate package treats AST nodes as
// opaque tokens it composes and prints — it never inspects them with
// TypeScript-Compiler-API guards that would need the original brands.

import {
  NodeFlags,
  SyntaxKind,
  TypeScriptFactory,
  type Node,
} from "@nestia/factory";

interface MutableEmitNode {
  leadingComments?: Array<{
    kind: number;
    text: string;
    hasTrailingNewLine?: boolean;
  }>;
}

interface TsValue {
  factory: typeof TypeScriptFactory;
  NodeFlags: typeof NodeFlags;
  SyntaxKind: typeof SyntaxKind;
  addSyntheticLeadingComment(
    node: Node,
    kind: number,
    text: string,
    hasTrailingNewLine?: boolean,
  ): Node;
  isUnionTypeNode(node: Node | undefined): node is Node;
  isTypeReferenceNode(node: Node | undefined): node is Node;
  isIdentifier(node: Node | undefined): node is Node;
}

const ts: TsValue = {
  factory: TypeScriptFactory,
  NodeFlags,
  SyntaxKind,
  // Pushes a synthetic leading comment onto the node's emit metadata, matching
  // the surface of the TypeScript-Compiler-API helper of the same name. The
  // @nestia/factory printer reads `emitNode.leadingComments` and emits them
  // before the node body.
  addSyntheticLeadingComment: (
    node: Node,
    kind: number,
    text: string,
    hasTrailingNewLine?: boolean,
  ): Node => {
    const mutable = node as Node & { emitNode?: MutableEmitNode };
    const emitNode = (mutable.emitNode ??= {});
    (emitNode.leadingComments ??= []).push({
      kind,
      text,
      hasTrailingNewLine,
    });
    return node;
  },
  isUnionTypeNode: (node: Node | undefined): node is Node =>
    !!node && node.kind === SyntaxKind.UnionType,
  isTypeReferenceNode: (node: Node | undefined): node is Node =>
    !!node && node.kind === SyntaxKind.TypeReference,
  isIdentifier: (node: Node | undefined): node is Node =>
    !!node && node.kind === SyntaxKind.Identifier,
};

type _Node = Node;

declare namespace ts {
  export type Node = _Node;
  export type CallExpression = Node;
  export type ConciseBody = Node;
  export type Decorator = Node;
  export type Expression = Node;
  export type FunctionDeclaration = Node;
  export type Identifier = Node;
  export type KeywordTypeNode = Node;
  export type MethodDeclaration = Node;
  export type ModuleDeclaration = Node;
  export type ParameterDeclaration = Node;
  export type Statement = Node;
  export type TypeAliasDeclaration = Node;
  export type TypeNode = Node;
  export type TypeReferenceNode = Node;
  export type UnionTypeNode = Node;
  export type VariableStatement = Node;
}

export default ts;
