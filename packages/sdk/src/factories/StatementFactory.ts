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
 * @evidence contracts/common.md#principled-implementation The namespace builds `let` and `const` statements.
 * @evidence contracts/common.md#clear-and-simple-design Three functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It only builds nodes.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation StatementFactory constructs TypeScript syntax nodes; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace StatementFactory {
  /**
   * Builds a `let` statement; without a type and an initializer it is typed
   * `any`.
   *
   * @evidence contracts/common.md#principled-implementation A declaration without either would be implicitly any, so the type is stated.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It follows the grammar.
   * @evidence contracts/common.md#meaningful-documentation The comment states the default type.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation StatementFactory.mut constructs TypeScript syntax nodes; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
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
   * Builds a `const` statement from a name, a type, and a value.
   *
   * @evidence contracts/common.md#principled-implementation The declaration list carries the const flag and the given parts.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It follows the grammar.
   * @evidence contracts/common.md#meaningful-documentation The comment states its inputs.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation StatementFactory.constant constructs TypeScript syntax nodes; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
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
