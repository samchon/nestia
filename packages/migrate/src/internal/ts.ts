// Compatibility shim that replaces `import ts from "typescript"`. AST
// construction now goes through `@ttsc/factory`'s `factory`, `SyntaxKind`, and
// `NodeFlags`, imported directly where needed; the value side here exposes only
// the `isUnionTypeNode` guard the migrate generators still call. The type
// aliases (`ts.Expression`, `ts.ParameterDeclaration`, …) map to the matching
// `@ttsc/factory` node types so existing annotations keep their precise shapes.
import {
  type Block,
  type CallExpression,
  type Decorator,
  type Expression,
  type FunctionDeclaration,
  type Identifier,
  type KeywordTypeNode,
  type MethodDeclaration,
  type ModuleDeclaration,
  type Node,
  type ParameterDeclaration,
  type Statement,
  type TypeAliasDeclaration,
  type TypeNode,
  type TypeReferenceNode,
  type UnionTypeNode,
  type VariableStatement,
} from "@ttsc/factory";

interface TsValue {
  isUnionTypeNode(node: Node | undefined): node is UnionTypeNode;
}

const ts: TsValue = {
  isUnionTypeNode: (node: Node | undefined): node is UnionTypeNode =>
    !!node && node.kind === "UnionTypeNode",
};

type _Block = Block;
type _CallExpression = CallExpression;
type _Decorator = Decorator;
type _Expression = Expression;
type _FunctionDeclaration = FunctionDeclaration;
type _Identifier = Identifier;
type _KeywordTypeNode = KeywordTypeNode;
type _MethodDeclaration = MethodDeclaration;
type _ModuleDeclaration = ModuleDeclaration;
type _Node = Node;
type _ParameterDeclaration = ParameterDeclaration;
type _Statement = Statement;
type _TypeAliasDeclaration = TypeAliasDeclaration;
type _TypeNode = TypeNode;
type _TypeReferenceNode = TypeReferenceNode;
type _UnionTypeNode = UnionTypeNode;
type _VariableStatement = VariableStatement;

declare namespace ts {
  export type Node = _Node;
  export type Block = _Block;
  export type CallExpression = _CallExpression;
  export type ConciseBody = _Block | _Expression;
  export type Decorator = _Decorator;
  export type Expression = _Expression;
  export type FunctionDeclaration = _FunctionDeclaration;
  export type Identifier = _Identifier;
  export type KeywordTypeNode = _KeywordTypeNode;
  export type MethodDeclaration = _MethodDeclaration;
  export type ModuleDeclaration = _ModuleDeclaration;
  export type ParameterDeclaration = _ParameterDeclaration;
  export type Statement = _Statement;
  export type TypeAliasDeclaration = _TypeAliasDeclaration;
  export type TypeNode = _TypeNode;
  export type TypeReferenceNode = _TypeReferenceNode;
  export type UnionTypeNode = _UnionTypeNode;
  export type VariableStatement = _VariableStatement;
}

export default ts;
