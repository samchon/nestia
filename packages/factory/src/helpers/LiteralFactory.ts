import { SyntaxKind } from "../constants/SyntaxKind";
import { createArrayLiteralExpression } from "../factory/expressions/createArrayLiteralExpression";
import { createObjectLiteralExpression } from "../factory/expressions/createObjectLiteralExpression";
import { createPropertyAssignment } from "../factory/expressions/createPropertyAssignment";
import { createFalse } from "../factory/literals/createFalse";
import { createIdentifier } from "../factory/literals/createIdentifier";
import { createNull } from "../factory/literals/createNull";
import { createStringLiteral } from "../factory/literals/createStringLiteral";
import { createTrue } from "../factory/literals/createTrue";
import type { Node } from "../structures/Node";

import { ExpressionFactory } from "./ExpressionFactory";
import { IdentifierFactory } from "./IdentifierFactory";

const PASSTHROUGH_KINDS = new Set<number>([
  SyntaxKind.ArrowFunction,
  SyntaxKind.CallExpression,
  SyntaxKind.Identifier,
]);

const isNode = (value: unknown): value is Node =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { kind?: unknown }).kind === "number";

/**
 * Recursive value-to-AST-literal builder. Hands back already-AST inputs
 * unchanged (so callers can mix factory output with raw JS values inside the
 * same object/array), and emits the appropriate literal node otherwise.
 * Replaces the legacy `@typia/core` `LiteralFactory.write` nestia generators
 * previously imported.
 */
export namespace LiteralFactory {
  export const write = (input: any): Node => {
    if (input === null) return createNull();
    if (isNode(input) && PASSTHROUGH_KINDS.has(input.kind)) return input;
    if (Array.isArray(input)) return writeArray(input);
    if (typeof input === "object") return writeObject(input as object);
    if (typeof input === "boolean") return input ? createTrue() : createFalse();
    if (typeof input === "number") return ExpressionFactory.number(input);
    if (typeof input === "string") return createStringLiteral(input);
    if (typeof input === "bigint") return createStringLiteral(input.toString());
    if (typeof input === "function") return createIdentifier("undefined");
    throw new TypeError("LiteralFactory.write: unsupported input type.");
  };

  const writeObject = (obj: object): Node =>
    createObjectLiteralExpression(
      Object.entries(obj)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) =>
          createPropertyAssignment(IdentifierFactory.identifier(key), write(value)),
        ),
      true,
    );

  const writeArray = (array: readonly any[]): Node =>
    createArrayLiteralExpression(array.map(write), true);
}
