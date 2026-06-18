import { SyntaxKind, factory } from "@ttsc/factory";
import * as typiaUtils from "@typia/utils";

import ts from "../internal/ts";

const { NamingConvention } =
  (typiaUtils as { default?: typeof typiaUtils }).default ?? typiaUtils;

export namespace TypeLiteralFactory {
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
