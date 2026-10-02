import {
  type Expression,
  NodeFlags,
  type TypeNode,
  type VariableStatement,
  factory,
} from "@ttsc/factory";

import { TypeFactory } from "./TypeFactory";

/**
 * Variable-statement helpers. `constant` emits `const`, `mut` emits `let`.
 *
 * @evidence contracts/common.md#principled-implementation The namespace builds `let` and `const` statements from a name, an optional type, and an optional value.
 * @evidence contracts/common.md#clear-and-simple-design Two functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It only builds nodes.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace StatementFactory {
  /**
   * Builds a `let` statement; a declaration without a type and without an
   * initializer is typed `any`.
   *
   * @evidence contracts/common.md#principled-implementation A `let` without both a type and an initializer would be implicitly any, so the type is stated explicitly in that case.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It follows the declaration grammar.
   * @evidence contracts/common.md#meaningful-documentation The comment states the default type.
   */
  export const mut = (props: {
    name: string;
    type?: TypeNode | undefined;
    initializer?: Expression | undefined;
  }): VariableStatement =>
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            props.name,
            undefined,
            props.type !== undefined
              ? props.type
              : props.initializer === undefined
                ? TypeFactory.keyword("any")
                : undefined,
            props.initializer,
          ),
        ],
        NodeFlags.Let,
      ),
    );

  /**
   * Builds a `const` statement from a name, an optional type, and an optional
   * value.
   *
   * @evidence contracts/common.md#principled-implementation The declaration list carries the const flag and the given parts.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It follows the declaration grammar.
   * @evidence contracts/common.md#meaningful-documentation The comment states its inputs.
   */
  export const constant = (props: {
    name: string;
    type?: TypeNode | undefined;
    value?: Expression | undefined;
  }): VariableStatement =>
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            props.name,
            undefined,
            props.type,
            props.value,
          ),
        ],
        NodeFlags.Const,
      ),
    );
}
