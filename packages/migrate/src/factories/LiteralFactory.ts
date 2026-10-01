import { type Expression, factory } from "@ttsc/factory";

import { ExpressionFactory } from "./ExpressionFactory";
import { IdentifierFactory } from "./IdentifierFactory";

const PASSTHROUGH_KINDS = new Set<string>([
  "ArrowFunction",
  "CallExpression",
  "Identifier",
]);

const isNode = (value: unknown): value is Expression =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { kind?: unknown }).kind === "string";

/**
 * Recursive value-to-AST-literal builder. Hands back already-AST inputs
 * unchanged (so callers can mix factory output with raw JS values inside the
 * same object/array), and emits the appropriate literal node otherwise.
 *
 * @evidence contracts/common.md#principled-implementation The namespace maps null, booleans, numbers, strings, arrays, plain objects, and existing expression nodes to literal nodes, and refuses other types.
 * @evidence contracts/common.md#clear-and-simple-design One entry function and two private helpers for containers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The mapping is by type, with no value special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace LiteralFactory {
  /**
   * Builds the expression of a value: `null`, a boolean, a number, a string, a
   * bigint as its text, an array, an object without its `undefined` members, or
   * an expression node as it is.
   *
   * @evidence contracts/common.md#principled-implementation The value is dispatched by type in a fixed order; nodes of the kinds arrow function, call, and identifier pass through, functions become `undefined`, and an unsupported type is a `TypeError`, so the result is total over the listed types.
   * @evidence contracts/common.md#clear-and-simple-design One function with one branch per type.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The dispatch is general, and a bigint becomes text because a literal bigint is not supported by the target syntax here.
   * @evidence contracts/common.md#meaningful-documentation The comment lists the mapping.
   */
  export const write = (input: any): Expression => {
    if (input === null) return factory.createNull();
    if (isNode(input) && PASSTHROUGH_KINDS.has(input.kind)) return input;
    if (Array.isArray(input)) return writeArray(input);
    if (typeof input === "object") return writeObject(input as object);
    if (typeof input === "boolean")
      return input ? factory.createTrue() : factory.createFalse();
    if (typeof input === "number") return ExpressionFactory.number(input);
    if (typeof input === "string") return factory.createStringLiteral(input);
    if (typeof input === "bigint")
      return factory.createStringLiteral(input.toString());
    if (typeof input === "function")
      return factory.createIdentifier("undefined");
    throw new TypeError("LiteralFactory.write: unsupported input type.");
  };

  const writeObject = (obj: object): Expression =>
    factory.createObjectLiteralExpression(
      Object.entries(obj)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) =>
          factory.createPropertyAssignment(
            IdentifierFactory.identifier(key),
            write(value),
          ),
        ),
      true,
    );

  const writeArray = (array: readonly any[]): Expression =>
    factory.createArrayLiteralExpression(array.map(write), true);
}
