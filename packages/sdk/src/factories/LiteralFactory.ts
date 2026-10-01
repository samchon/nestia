import { type Expression, SyntaxKind, factory } from "@ttsc/factory";

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
 * @evidence contracts/common.md#principled-implementation The namespace maps values to literal nodes by type.
 * @evidence contracts/common.md#clear-and-simple-design One function and two helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The mapping is by type.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace LiteralFactory {
  /**
   * Builds the expression of a value; arrow function, call, and identifier
   * nodes pass through, and unsupported types throw.
   *
   * @evidence contracts/common.md#principled-implementation The value is dispatched by type in a fixed order and containers are written element by element.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The dispatch is general.
   * @evidence contracts/common.md#meaningful-documentation The comment states the mapping.
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
      return input < BigInt(0)
        ? factory.createPrefixUnaryExpression(
            SyntaxKind.MinusToken,
            factory.createBigIntLiteral((-input).toString()),
          )
        : factory.createBigIntLiteral(input.toString());
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
