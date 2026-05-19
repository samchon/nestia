import { TypeScriptFactory } from "@nestia/factory";
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
            : TypeScriptFactory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);

  const generatestring = (str: string) =>
    TypeScriptFactory.createLiteralTypeNode(
      TypeScriptFactory.createStringLiteral(str),
    );

  const generateNumber = (num: number) =>
    TypeScriptFactory.createLiteralTypeNode(
      num < 0
        ? TypeScriptFactory.createPrefixUnaryExpression(
            ts.SyntaxKind.MinusToken,
            TypeScriptFactory.createNumericLiteral(-num),
          )
        : TypeScriptFactory.createNumericLiteral(num),
    );

  const generateBoolean = (bool: boolean) =>
    TypeScriptFactory.createLiteralTypeNode(
      bool ? TypeScriptFactory.createTrue() : TypeScriptFactory.createFalse(),
    );

  const generateNull = () =>
    TypeScriptFactory.createLiteralTypeNode(TypeScriptFactory.createNull());

  const generateTuple = (items: any[]) =>
    TypeScriptFactory.createTupleTypeNode(items.map(generate));

  const generateObject = (obj: object) =>
    TypeScriptFactory.createTypeLiteralNode(
      Object.entries(obj).map(([key, value]) =>
        TypeScriptFactory.createPropertySignature(
          undefined,
          NamingConvention.variable(key)
            ? TypeScriptFactory.createIdentifier(key)
            : TypeScriptFactory.createStringLiteral(key),
          undefined,
          generate(value),
        ),
      ),
    );
}
