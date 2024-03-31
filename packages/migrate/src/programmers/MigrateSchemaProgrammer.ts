import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";
import { FormatCheatSheet } from "typia/lib/tags/internal/FormatCheatSheet";
import { Escaper } from "typia/lib/utils/Escaper";

import { ISwaggerComponents } from "../structures/ISwaggerComponents";
import { ISwaggerSchema } from "../structures/ISwaggerSchema";
import { FilePrinter } from "../utils/FilePrinter";
import { SwaggerTypeChecker } from "../utils/SwaggerTypeChecker";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";

export namespace MigrateSchemaProgrammer {
  /* -----------------------------------------------------------
    FACADE
  ----------------------------------------------------------- */
  export const write =
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (schema: ISwaggerSchema): ts.TypeNode => {
      const union: ts.TypeNode[] = [];
      if (SwaggerTypeChecker.isUnknown(schema))
        return TypeFactory.keyword("any");
      else if (SwaggerTypeChecker.isNullOnly(schema)) return createNode("null");
      else if (SwaggerTypeChecker.isNullable(components)(schema))
        union.push(createNode("null"));

      const type: ts.TypeNode = (() => {
        // ATOMIC
        if (SwaggerTypeChecker.isBoolean(schema)) return writeBoolean(schema);
        else if (SwaggerTypeChecker.isInteger(schema))
          return writeInteger(importer)(schema);
        else if (SwaggerTypeChecker.isNumber(schema))
          return writeNumber(importer)(schema);
        // INSTANCES
        else if (SwaggerTypeChecker.isString(schema))
          return writeString(importer)(schema);
        else if (SwaggerTypeChecker.isArray(schema))
          return writeArray(components)(importer)(schema);
        else if (SwaggerTypeChecker.isObject(schema))
          return writeObject(components)(importer)(schema);
        else if (SwaggerTypeChecker.isReference(schema))
          return writeReference(importer)(schema);
        // NESTED UNION
        else if (SwaggerTypeChecker.isAnyOf(schema))
          return writeUnion(components)(importer)(schema.anyOf);
        else if (SwaggerTypeChecker.isOneOf(schema))
          return writeUnion(components)(importer)(schema.oneOf);
        else return TypeFactory.keyword("any");
      })();
      union.push(type);

      if (union.length === 0) return TypeFactory.keyword("any");
      else if (union.length === 1) return union[0];
      return ts.factory.createUnionTypeNode(union);
    };

  /* -----------------------------------------------------------
    ATOMICS
  ----------------------------------------------------------- */
  const writeBoolean = (schema: ISwaggerSchema.IBoolean): ts.TypeNode => {
    if (schema.enum?.length)
      return ts.factory.createLiteralTypeNode(
        schema.enum[0] ? ts.factory.createTrue() : ts.factory.createFalse(),
      );
    return TypeFactory.keyword("boolean");
  };

  const writeInteger =
    (importer: MigrateImportProgrammer) =>
    (schema: ISwaggerSchema.IInteger): ts.TypeNode =>
      writeNumeric(() => [
        TypeFactory.keyword("number"),
        importer.tag("Type", "int32"),
      ])(importer)(schema);

  const writeNumber =
    (importer: MigrateImportProgrammer) =>
    (schema: ISwaggerSchema.INumber): ts.TypeNode =>
      writeNumeric(() => [TypeFactory.keyword("number")])(importer)(schema);

  const writeNumeric =
    (factory: () => ts.TypeNode[]) =>
    (importer: MigrateImportProgrammer) =>
    (schema: ISwaggerSchema.IInteger | ISwaggerSchema.INumber): ts.TypeNode => {
      if (schema.enum?.length)
        return ts.factory.createUnionTypeNode(
          schema.enum.map((i) =>
            ts.factory.createLiteralTypeNode(ExpressionFactory.number(i)),
          ),
        );
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

      return intersection.length === 1
        ? intersection[0]
        : ts.factory.createIntersectionTypeNode(intersection);
    };

  const writeString =
    (importer: MigrateImportProgrammer) =>
    (schema: ISwaggerSchema.IString): ts.TypeNode => {
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
      return intersection.length === 1
        ? intersection[0]
        : ts.factory.createIntersectionTypeNode(intersection);
    };

  /* -----------------------------------------------------------
    INSTANCES
  ----------------------------------------------------------- */
  const writeArray =
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (schema: ISwaggerSchema.IArray): ts.TypeNode => {
      const intersection: ts.TypeNode[] = [
        ts.factory.createArrayTypeNode(
          write(components)(importer)(schema.items),
        ),
      ];
      if (schema.minItems !== undefined)
        intersection.push(importer.tag("MinItems", schema.minItems));
      if (schema.maxItems !== undefined)
        intersection.push(importer.tag("MaxItems", schema.maxItems));
      return intersection.length === 1
        ? intersection[0]
        : ts.factory.createIntersectionTypeNode(intersection);
    };

  const writeObject =
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (schema: ISwaggerSchema.IObject): ts.TypeNode => {
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
            schema.additionalProperties as ISwaggerSchema,
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
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (required: string[]) =>
    (key: string, value: ISwaggerSchema) =>
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
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (value: ISwaggerSchema) =>
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
      schema: ISwaggerSchema.IReference,
    ): ts.TypeReferenceNode | ts.KeywordTypeNode => {
      if (schema.$ref.startsWith("#/components/schemas") === false)
        return TypeFactory.keyword("any");
      const name: string = schema.$ref.split("/").at(-1)!;
      return name === ""
        ? TypeFactory.keyword("any")
        : importer.dto(schema.$ref.split("/").at(-1)!);
    };

  /* -----------------------------------------------------------
    UNIONS
  ----------------------------------------------------------- */
  const writeUnion =
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (elements: ISwaggerSchema[]): ts.UnionTypeNode =>
      ts.factory.createUnionTypeNode(elements.map(write(components)(importer)));
}
const createNode = (text: string) => ts.factory.createTypeReferenceNode(text);
const writeComment = (schema: ISwaggerSchema): string =>
  [
    ...(schema.description?.length ? [schema.description] : []),
    ...(schema.description?.length &&
    (schema.title !== undefined || schema.deprecated === true)
      ? [""]
      : []),
    ...(schema.title !== undefined ? [`@title ${schema.title}`] : []),
    ...(schema.deprecated === true ? [`@deprecated`] : []),
  ].join("\n");
