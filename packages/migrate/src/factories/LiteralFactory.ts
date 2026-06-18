import {
  type ArrayLiteralExpression,
  type Expression,
  type ObjectLiteralExpression,
  factory,
} from "@ttsc/factory";

import { ExpressionFactory } from "./ExpressionFactory";
import { IdentifierFactory } from "./IdentifierFactory";

/**
 * JS value → AST expression helper, mirroring `@typia/core`'s
 * `LiteralFactory.write`, built on `@ttsc/factory` so no `typescript` runtime
 * is bundled.
 */
export namespace LiteralFactory {
  export const write = (input: any): Expression => {
    if (input === null) return factory.createNull();
    else if (isFactoryNode(input)) return input;
    else if (input instanceof Array) return writeArray(input);
    else if (typeof input === "object") return writeObject(input);
    else if (typeof input === "boolean")
      return input ? factory.createTrue() : factory.createFalse();
    else if (typeof input === "bigint") return ExpressionFactory.bigint(input);
    else if (typeof input === "number") return ExpressionFactory.number(input);
    else if (typeof input === "string")
      return factory.createStringLiteral(input);
    // unreachable code
    else if (typeof input === "function")
      return factory.createIdentifier("undefined");
    else throw new TypeError("Error on LiteralFactory.write(): unknown type.");
  };

  /** Pass already-built expression nodes (arrow / call / identifier) through. */
  const PASSTHROUGH: ReadonlySet<string> = new Set([
    "ArrowFunction",
    "CallExpression",
    "Identifier",
  ]);
  const isFactoryNode = (input: any): input is Expression =>
    typeof input === "object" &&
    input !== null &&
    typeof (input as { kind?: unknown }).kind === "string" &&
    PASSTHROUGH.has((input as { kind: string }).kind);

  const writeObject = (obj: object): ObjectLiteralExpression =>
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

  const writeArray = (array: any[]): ArrayLiteralExpression =>
    factory.createArrayLiteralExpression(array.map(write), true);
}
