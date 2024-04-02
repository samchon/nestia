import ts from "typescript";
import { Escaper } from "typia/lib/utils/Escaper";

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
            : ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);

  const generatestring = (str: string) =>
    ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(str));

  const generateNumber = (num: number) =>
    ts.factory.createLiteralTypeNode(ts.factory.createNumericLiteral(num));

  const generateBoolean = (bool: boolean) =>
    ts.factory.createLiteralTypeNode(
      bool ? ts.factory.createTrue() : ts.factory.createFalse(),
    );

  const generateNull = () =>
    ts.factory.createLiteralTypeNode(ts.factory.createNull());

  const generateTuple = (items: any[]) =>
    ts.factory.createTupleTypeNode(items.map(generate));

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
