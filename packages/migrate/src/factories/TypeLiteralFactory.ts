import ts from "typescript";
import { Escaper } from "typia/lib/utils/Escaper";

/**
 * Namespace containing functions for generating TypeScript type literal nodes.
 * 
 * This factory creates TypeScript AST nodes representing literal types from
 * JavaScript values, useful for generating type-safe constants and literal
 * type definitions in generated code.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace TypeLiteralFactory {
  /**
   * Generates a TypeScript type node from a JavaScript value.
   * 
   * Converts primitive values, objects, and arrays into their corresponding
   * TypeScript literal type representations. Handles nested structures
   * recursively to create complex type definitions.
   * 
   * @param value - The JavaScript value to convert to a type node
   * @returns TypeScript type node representing the literal type
   */
  export const generate = (value: any): ts.TypeNode =>
    typeof value === "boolean"
      ? generateBoolean(value)
      : typeof value === "number"
        ? generateNumber(value)
        : typeof value === "string"
          ? generatestring(value)
          : typeof value === "object"
            ? value === null
              ? generateNull()
              : Array.isArray(value)
                ? generateTuple(value)
                : generateObject(value)
            : ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);

  /**
   * Generates a string literal type node.
   * @param str - The string value
   * @returns TypeScript string literal type node
   * @internal
   */
  const generatestring = (str: string) =>
    ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(str));

  /**
   * Generates a number literal type node.
   * @param num - The number value
   * @returns TypeScript number literal type node
   * @internal
   */
  const generateNumber = (num: number) =>
    ts.factory.createLiteralTypeNode(
      num < 0
        ? ts.factory.createPrefixUnaryExpression(
            ts.SyntaxKind.MinusToken,
            ts.factory.createNumericLiteral(-num),
          )
        : ts.factory.createNumericLiteral(num),
    );

  /**
   * Generates a boolean literal type node.
   * @param bool - The boolean value
   * @returns TypeScript boolean literal type node
   * @internal
   */
  const generateBoolean = (bool: boolean) =>
    ts.factory.createLiteralTypeNode(
      bool ? ts.factory.createTrue() : ts.factory.createFalse(),
    );

  /**
   * Generates a null literal type node.
   * @returns TypeScript null literal type node
   * @internal
   */
  const generateNull = () =>
    ts.factory.createLiteralTypeNode(ts.factory.createNull());

  /**
   * Generates a tuple type node from an array.
   * @param items - Array of values to convert to tuple elements
   * @returns TypeScript tuple type node
   * @internal
   */
  const generateTuple = (items: any[]) =>
    ts.factory.createTupleTypeNode(items.map(generate));

  /**
   * Generates an object literal type node.
   * @param obj - Object to convert to type literal
   * @returns TypeScript object literal type node
   * @internal
   */
  const generateObject = (obj: object) =>
    ts.factory.createTypeLiteralNode(
      Object.entries(obj).map(([key, value]) =>
        ts.factory.createPropertySignature(
          undefined,
          Escaper.variable(key)
            ? ts.factory.createIdentifier(key)
            : ts.factory.createStringLiteral(key),
          undefined,
          generate(value),
        ),
      ),
    );
}
