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

/**
 * A compatibility stand-in for `import ts from "typescript"`: the one value the
 * generators still call, and the node types under the names they use.
 *
 * @evidence contracts/common.md#principled-implementation The value is the union-type guard, and the namespace aliases map each used compiler type name to the matching node type of the factory package, so existing annotations keep their exact shapes.
 * @evidence contracts/common.md#clear-and-simple-design One value and one declaration-only namespace of aliases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It avoids loading the compiler; the guard is implemented on the node kind, not on a patched compiler.
 * @evidence contracts/common.md#meaningful-documentation The leading comment explains why the shim exists.
 */
declare namespace ts {
  /**
   * The `Node` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `Node` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type Node = _Node;
  /**
   * The `Block` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `Block` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type Block = _Block;
  /**
   * The `CallExpression` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `CallExpression` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type CallExpression = _CallExpression;
  /**
   * The `ConciseBody` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation A concise body is a block or an expression, the same union the compiler defines.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type ConciseBody = _Block | _Expression;
  /**
   * The `Decorator` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `Decorator` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type Decorator = _Decorator;
  /**
   * The `Expression` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `Expression` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type Expression = _Expression;
  /**
   * The `FunctionDeclaration` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `FunctionDeclaration` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type FunctionDeclaration = _FunctionDeclaration;
  /**
   * The `Identifier` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `Identifier` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type Identifier = _Identifier;
  /**
   * The `KeywordTypeNode` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `KeywordTypeNode` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type KeywordTypeNode = _KeywordTypeNode;
  /**
   * The `MethodDeclaration` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `MethodDeclaration` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type MethodDeclaration = _MethodDeclaration;
  /**
   * The `ModuleDeclaration` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `ModuleDeclaration` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type ModuleDeclaration = _ModuleDeclaration;
  /**
   * The `ParameterDeclaration` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `ParameterDeclaration` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type ParameterDeclaration = _ParameterDeclaration;
  /**
   * The `Statement` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `Statement` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type Statement = _Statement;
  /**
   * The `TypeAliasDeclaration` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `TypeAliasDeclaration` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type TypeAliasDeclaration = _TypeAliasDeclaration;
  /**
   * The `TypeNode` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `TypeNode` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type TypeNode = _TypeNode;
  /**
   * The `TypeReferenceNode` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `TypeReferenceNode` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type TypeReferenceNode = _TypeReferenceNode;
  /**
   * The `UnionTypeNode` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `UnionTypeNode` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type UnionTypeNode = _UnionTypeNode;
  /**
   * The `VariableStatement` node type under the name the generators use.
   *
   * @evidence contracts/common.md#principled-implementation The alias names the `VariableStatement` node type of the factory package.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The alias is named after the compiler type it replaces, and the file comment explains the shim.
   */
  export type VariableStatement = _VariableStatement;
}

export default ts;
