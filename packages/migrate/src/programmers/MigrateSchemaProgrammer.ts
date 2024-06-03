import { OpenApi } from "@samchon/openapi";
import ts from "typescript";
import typia from "typia";
import { TypeFactory } from "typia/lib/factories/TypeFactory";
import { FormatCheatSheet } from "typia/lib/tags/internal/FormatCheatSheet";
import { Escaper } from "typia/lib/utils/Escaper";

import { FilePrinter } from "../utils/FilePrinter";
import { OpenApiTypeChecker } from "../utils/OpenApiTypeChecker";
import { StringUtil } from "../utils/StringUtil";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";

export namespace MigrateSchemaProgrammer {
  /* -----------------------------------------------------------
    FACADE
  ----------------------------------------------------------- */
  export const write =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (schema: OpenApi.IJsonSchema): ts.TypeNode => {
      // CONSIDER ANY TYPE CASE
      const union: ts.TypeNode[] = [];
      if (OpenApiTypeChecker.isUnknown(schema))
        return TypeFactory.keyword("any");

      // ITERATION
      const type: ts.TypeNode = (() => {
        // ATOMIC
        if (OpenApiTypeChecker.isConstant(schema))
          return writeConstant(importer)(schema);
        else if (OpenApiTypeChecker.isBoolean(schema))
          return writeBoolean(importer)(schema);
        else if (OpenApiTypeChecker.isInteger(schema))
          return writeInteger(importer)(schema);
        else if (OpenApiTypeChecker.isNumber(schema))
          return writeNumber(importer)(schema);
        else if (OpenApiTypeChecker.isString(schema))
          return writeString(importer)(schema);
        // INSTANCES
        else if (OpenApiTypeChecker.isArray(schema))
          return writeArray(components)(importer)(schema);
        else if (OpenApiTypeChecker.isTuple(schema))
          return writeTuple(components)(importer)(schema);
        else if (OpenApiTypeChecker.isObject(schema))
          return writeObject(components)(importer)(schema);
        else if (OpenApiTypeChecker.isReference(schema))
          return writeReference(importer)(schema);
        // UNION
        else if (OpenApiTypeChecker.isOneOf(schema))
          return writeUnion(components)(importer)(schema.oneOf);
        else if (OpenApiTypeChecker.isNull(schema)) return createNode("null");
        else return TypeFactory.keyword("any");
      })();
      union.push(type);

      // DETERMINE
      if (union.length === 0) return TypeFactory.keyword("any");
      else if (union.length === 1) return union[0];
      return ts.factory.createUnionTypeNode(union);
    };

  /* -----------------------------------------------------------
    ATOMICS
  ----------------------------------------------------------- */
  const writeConstant =
    (importer: MigrateImportProgrammer) =>
    (schema: OpenApi.IJsonSchema.IConstant): ts.TypeNode => {
      const intersection: ts.TypeNode[] = [
        ts.factory.createLiteralTypeNode(
          typeof schema.const === "boolean"
            ? schema.const === true
              ? ts.factory.createTrue()
              : ts.factory.createFalse()
            : typeof schema.const === "number"
              ? schema.const < 0
                ? ts.factory.createPrefixUnaryExpression(
                    ts.SyntaxKind.MinusToken,
                    ts.factory.createNumericLiteral(-schema.const),
                  )
                : ts.factory.createNumericLiteral(schema.const)
              : ts.factory.createStringLiteral(schema.const),
        ),
      ];
      writePlugin({
        importer,
        regular: typia.misc.literals<keyof OpenApi.IJsonSchema.IConstant>(),
        intersection,
      })(schema);
      return intersection.length === 1
        ? intersection[0]
        : ts.factory.createIntersectionTypeNode(intersection);
    };

  const writeBoolean =
    (importer: MigrateImportProgrammer) =>
    (schema: OpenApi.IJsonSchema.IBoolean): ts.TypeNode => {
      const intersection: ts.TypeNode[] = [TypeFactory.keyword("boolean")];
      writePlugin({
        importer,
        regular: typia.misc.literals<keyof OpenApi.IJsonSchema.IBoolean>(),
        intersection,
      })(schema);
      return intersection.length === 1
        ? intersection[0]
        : ts.factory.createIntersectionTypeNode(intersection);
    };

  const writeInteger =
    (importer: MigrateImportProgrammer) =>
    (schema: OpenApi.IJsonSchema.IInteger): ts.TypeNode =>
      writeNumeric(() => [
        TypeFactory.keyword("number"),
        importer.tag("Type", "int32"),
      ])(importer)(schema);

  const writeNumber =
    (importer: MigrateImportProgrammer) =>
    (schema: OpenApi.IJsonSchema.INumber): ts.TypeNode =>
      writeNumeric(() => [TypeFactory.keyword("number")])(importer)(schema);

  const writeNumeric =
    (factory: () => ts.TypeNode[]) =>
    (importer: MigrateImportProgrammer) =>
    (
      schema: OpenApi.IJsonSchema.IInteger | OpenApi.IJsonSchema.INumber,
    ): ts.TypeNode => {
      const intersection: ts.TypeNode[] = factory();
      if (schema.default !== undefined)
        intersection.push(importer.tag("Default", schema.default));
      if (schema.minimum !== undefined)
        intersection.push(
          importer.tag(
            schema.exclusiveMinimum ? "ExclusiveMinimum" : "Minimum",
            schema.minimum,
          ),
        );
      if (schema.maximum !== undefined)
        intersection.push(
          importer.tag(
            schema.exclusiveMaximum ? "ExclusiveMaximum" : "Maximum",
            schema.maximum,
          ),
        );
      if (schema.multipleOf !== undefined)
        intersection.push(importer.tag("MultipleOf", schema.multipleOf));
      writePlugin({
        importer,
        regular: typia.misc.literals<keyof OpenApi.IJsonSchema.INumber>(),
        intersection,
      })(schema);
      return intersection.length === 1
        ? intersection[0]
        : ts.factory.createIntersectionTypeNode(intersection);
    };

  const writeString =
    (importer: MigrateImportProgrammer) =>
    (schema: OpenApi.IJsonSchema.IString): ts.TypeNode => {
      if (schema.format === "binary")
        return ts.factory.createTypeReferenceNode("File");

      const intersection: ts.TypeNode[] = [TypeFactory.keyword("string")];
      if (schema.default !== undefined)
        intersection.push(importer.tag("Default", schema.default));
      if (schema.minLength !== undefined)
        intersection.push(importer.tag("MinLength", schema.minLength));
      if (schema.maxLength !== undefined)
        intersection.push(importer.tag("MaxLength", schema.maxLength));
      if (schema.pattern !== undefined)
        intersection.push(importer.tag("Pattern", schema.pattern));
      if (
        schema.format !== undefined &&
        (FormatCheatSheet as Record<string, string>)[schema.format] !==
          undefined
      )
        intersection.push(importer.tag("Format", schema.format));
      if (schema.contentMediaType !== undefined)
        intersection.push(
          importer.tag("ContentMediaType", schema.contentMediaType),
        );
      writePlugin({
        importer,
        regular: typia.misc.literals<keyof OpenApi.IJsonSchema.IString>(),
        intersection,
      })(schema);
      return intersection.length === 1
        ? intersection[0]
        : ts.factory.createIntersectionTypeNode(intersection);
    };

  /* -----------------------------------------------------------
    INSTANCES
  ----------------------------------------------------------- */
  const writeArray =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (schema: OpenApi.IJsonSchema.IArray): ts.TypeNode => {
      const intersection: ts.TypeNode[] = [
        ts.factory.createArrayTypeNode(
          write(components)(importer)(schema.items),
        ),
      ];
      if (schema.minItems !== undefined)
        intersection.push(importer.tag("MinItems", schema.minItems));
      if (schema.maxItems !== undefined)
        intersection.push(importer.tag("MaxItems", schema.maxItems));
      writePlugin({
        importer,
        regular: typia.misc.literals<keyof OpenApi.IJsonSchema.IArray>(),
        intersection,
      })(schema);
      return intersection.length === 1
        ? intersection[0]
        : ts.factory.createIntersectionTypeNode(intersection);
    };

  const writeTuple =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (schema: OpenApi.IJsonSchema.ITuple): ts.TypeNode => {
      const tuple: ts.TypeNode = ts.factory.createTupleTypeNode([
        ...schema.prefixItems.map(write(components)(importer)),
        ...(typeof schema.additionalItems === "object" &&
        schema.additionalItems !== null
          ? [
              ts.factory.createRestTypeNode(
                write(components)(importer)(schema.additionalItems),
              ),
            ]
          : schema.additionalItems === true
            ? [
                ts.factory.createRestTypeNode(
                  ts.factory.createArrayTypeNode(
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                  ),
                ),
              ]
            : []),
      ]);
      const intersection: ts.TypeNode[] = [tuple];
      writePlugin({
        importer,
        regular: typia.misc.literals<keyof OpenApi.IJsonSchema.ITuple>(),
        intersection,
      })(schema);
      return intersection.length === 1
        ? intersection[0]
        : ts.factory.createIntersectionTypeNode(intersection);
    };

  const writeObject =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (schema: OpenApi.IJsonSchema.IObject): ts.TypeNode => {
      const regular = () =>
        ts.factory.createTypeLiteralNode(
          Object.entries(schema.properties ?? []).map(([key, value]) =>
            writeRegularProperty(components)(importer)(schema.required ?? [])(
              key,
              value,
            ),
          ),
        );
      const dynamic = () =>
        ts.factory.createTypeLiteralNode([
          writeDynamicProperty(components)(importer)(
            schema.additionalProperties as OpenApi.IJsonSchema,
          ),
        ]);
      return !!schema.properties?.length &&
        typeof schema.additionalProperties === "object"
        ? ts.factory.createIntersectionTypeNode([regular(), dynamic()])
        : typeof schema.additionalProperties === "object"
          ? dynamic()
          : regular();
    };

  const writeRegularProperty =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (required: string[]) =>
    (key: string, value: OpenApi.IJsonSchema) =>
      FilePrinter.description(
        ts.factory.createPropertySignature(
          undefined,
          Escaper.variable(key)
            ? ts.factory.createIdentifier(key)
            : ts.factory.createStringLiteral(key),
          required.includes(key)
            ? undefined
            : ts.factory.createToken(ts.SyntaxKind.QuestionToken),
          write(components)(importer)(value),
        ),
        writeComment(value),
      );

  const writeDynamicProperty =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (value: OpenApi.IJsonSchema) =>
      FilePrinter.description(
        ts.factory.createIndexSignature(
          undefined,
          [
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              ts.factory.createIdentifier("key"),
              undefined,
              TypeFactory.keyword("string"),
            ),
          ],
          write(components)(importer)(value),
        ),
        writeComment(value),
      );

  const writeReference =
    (importer: MigrateImportProgrammer) =>
    (
      schema: OpenApi.IJsonSchema.IReference,
    ): ts.TypeReferenceNode | ts.KeywordTypeNode => {
      if (schema.$ref.startsWith("#/components/schemas") === false)
        return TypeFactory.keyword("any");
      const name: string = schema.$ref
        .split("/")
        .slice(3)
        .filter((str) => str.length !== 0)
        .map(StringUtil.escapeNonVariableSymbols)
        .join("");
      if (name === "") return TypeFactory.keyword("any");
      return importer.dto(name);
    };

  /* -----------------------------------------------------------
    UNIONS
  ----------------------------------------------------------- */
  const writeUnion =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (elements: OpenApi.IJsonSchema[]): ts.UnionTypeNode =>
      ts.factory.createUnionTypeNode(elements.map(write(components)(importer)));
}
const createNode = (text: string) => ts.factory.createTypeReferenceNode(text);
const writeComment = (schema: OpenApi.IJsonSchema): string =>
  [
    ...(schema.description?.length ? [schema.description] : []),
    ...(schema.description?.length &&
    (schema.title !== undefined || schema.deprecated === true)
      ? [""]
      : []),
    ...(schema.title !== undefined ? [`@title ${schema.title}`] : []),
    ...(schema.deprecated === true ? [`@deprecated`] : []),
  ].join("\n");
const writePlugin =
  (props: {
    importer: MigrateImportProgrammer;
    regular: string[];
    intersection: ts.TypeNode[];
  }) =>
  (schema: any) => {
    const extra: any = {};
    for (const [key, value] of Object.entries(schema))
      if (value !== undefined && false === props.regular.includes(key))
        extra[key] = value;
    if (Object.keys(extra).length !== 0)
      props.intersection.push(props.importer.tag("JsonSchemaPlugin", extra));
  };
