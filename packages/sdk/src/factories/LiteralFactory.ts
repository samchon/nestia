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
 */
export namespace LiteralFactory {
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
