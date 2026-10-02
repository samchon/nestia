import { SyntaxKind, factory } from "@ttsc/factory";
import { NamingConvention } from "@typia/utils";

import ts from "../internal/ts";

/**
 * Builds type nodes from JavaScript values, so a value can be written as a
 * literal type.
 *
 * @evidence contracts/common.md#principled-implementation The namespace maps booleans, numbers, strings, null, arrays as tuples, and objects as type literals, and anything else to `any`.
 * @evidence contracts/common.md#clear-and-simple-design One entry function and small private builders per kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The mapping is by type, with no value special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace TypeLiteralFactory {
  /**
   * Builds the literal type of a value: a literal for a primitive, a tuple for
   * an array, a type literal for an object, and `any` for other values.
   *
   * @evidence contracts/common.md#principled-implementation The value is dispatched by type, negative numbers use a prefix minus as expressions do, and object keys that are not identifiers are quoted.
   * @evidence contracts/common.md#clear-and-simple-design One function with one branch per kind.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The dispatch is general.
   * @evidence contracts/common.md#meaningful-documentation The comment lists the mapping.
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
            : factory.createKeywordTypeNode(SyntaxKind.AnyKeyword);

  const generatestring = (str: string) =>
    factory.createLiteralTypeNode(factory.createStringLiteral(str));

  const generateNumber = (num: number) =>
    factory.createLiteralTypeNode(
      num < 0
        ? factory.createPrefixUnaryExpression(
            SyntaxKind.MinusToken,
            factory.createNumericLiteral(-num),
          )
        : factory.createNumericLiteral(num),
    );

  const generateBoolean = (bool: boolean) =>
    factory.createLiteralTypeNode(
      bool ? factory.createTrue() : factory.createFalse(),
    );

  const generateNull = () =>
    factory.createLiteralTypeNode(factory.createNull());

  const generateTuple = (items: any[]) =>
    factory.createTupleTypeNode(items.map(generate));

  const generateObject = (obj: object) =>
    factory.createTypeLiteralNode(
      Object.entries(obj).map(([key, value]) =>
        factory.createPropertySignature(
          undefined,
          NamingConvention.variable(key)
            ? factory.createIdentifier(key)
            : factory.createStringLiteral(key),
          undefined,
          generate(value),
        ),
      ),
    );
}
