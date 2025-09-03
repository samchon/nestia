import { OpenApi } from "@samchon/openapi";
import ts from "typescript";
import typia from "typia";
import { TypeFactory } from "typia/lib/factories/TypeFactory";
import { FormatCheatSheet } from "typia/lib/tags/internal/FormatCheatSheet";
import { Escaper } from "typia/lib/utils/Escaper";

import { FilePrinter } from "../utils/FilePrinter";
import { OpenApiTypeChecker } from "../utils/OpenApiTypeChecker";
import { StringUtil } from "../utils/StringUtil";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";

export namespace NestiaMigrateSchemaProgrammer {
  /* -----------------------------------------------------------
    FACADE
  ----------------------------------------------------------- */
  export const write = (props: {
    components: OpenApi.IComponents;
    importer: NestiaMigrateImportProgrammer;
    schema: OpenApi.IJsonSchema;
  }): ts.TypeNode => {
    // CONSIDER ANY TYPE CASE
    const union: ts.TypeNode[] = [];
    if (OpenApiTypeChecker.isUnknown(props.schema))
      return TypeFactory.keyword("any");

    // ITERATION
    const type: ts.TypeNode = (() => {
      // ATOMIC
      if (OpenApiTypeChecker.isConstant(props.schema))
        return writeConstant({
          importer: props.importer,
          schema: props.schema,
        });
      else if (OpenApiTypeChecker.isBoolean(props.schema))
        return writeBoolean({
          importer: props.importer,
          schema: props.schema,
        });
      else if (OpenApiTypeChecker.isInteger(props.schema))
        return writeInteger({
          importer: props.importer,
          schema: props.schema,
        });
      else if (OpenApiTypeChecker.isNumber(props.schema))
        return writeNumber({
          importer: props.importer,
          schema: props.schema,
        });
      else if (OpenApiTypeChecker.isString(props.schema))
        return writeString({
          importer: props.importer,
          schema: props.schema,
        });
      // INSTANCES
      else if (OpenApiTypeChecker.isArray(props.schema))
        return writeArray({
          components: props.components,
          importer: props.importer,
          schema: props.schema,
        });
      else if (OpenApiTypeChecker.isTuple(props.schema))
        return writeTuple({
          components: props.components,
          importer: props.importer,
          schema: props.schema,
        });
      else if (OpenApiTypeChecker.isObject(props.schema))
        return writeObject({
          components: props.components,
          importer: props.importer,
          schema: props.schema,
        });
      else if (OpenApiTypeChecker.isReference(props.schema))
        return writeReference({
          importer: props.importer,
          schema: props.schema,
        });
      // UNION
      else if (OpenApiTypeChecker.isOneOf(props.schema))
        return writeUnion({
          components: props.components,
          importer: props.importer,
          elements: props.schema.oneOf,
        });
      else if (OpenApiTypeChecker.isNull(props.schema))
        return createNode("null");
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
  const writeConstant = (props: {
    importer: NestiaMigrateImportProgrammer;
    schema: OpenApi.IJsonSchema.IConstant;
  }): ts.TypeNode => {
    const intersection: ts.TypeNode[] = [
      ts.factory.createLiteralTypeNode(
        typeof props.schema.const === "boolean"
          ? props.schema.const === true
            ? ts.factory.createTrue()
            : ts.factory.createFalse()
          : typeof props.schema.const === "number"
            ? props.schema.const < 0
              ? ts.factory.createPrefixUnaryExpression(
                  ts.SyntaxKind.MinusToken,
                  ts.factory.createNumericLiteral(-props.schema.const),
                )
              : ts.factory.createNumericLiteral(props.schema.const)
            : ts.factory.createStringLiteral(props.schema.const),
      ),
    ];
    writePlugin({
      importer: props.importer,
      schema: props.schema,
      regular: typia.misc.literals<keyof OpenApi.IJsonSchema.IConstant>(),
      intersection,
    });
    return intersection.length === 1
      ? intersection[0]
      : ts.factory.createIntersectionTypeNode(intersection);
  };

  const writeBoolean = (props: {
    importer: NestiaMigrateImportProgrammer;
    schema: OpenApi.IJsonSchema.IBoolean;
  }): ts.TypeNode => {
    const intersection: ts.TypeNode[] = [TypeFactory.keyword("boolean")];
    writePlugin({
      importer: props.importer,
      regular: typia.misc.literals<keyof OpenApi.IJsonSchema.IBoolean>(),
      intersection,
      schema: props.schema,
    });
    return intersection.length === 1
      ? intersection[0]
      : ts.factory.createIntersectionTypeNode(intersection);
  };

  const writeInteger = (props: {
    importer: NestiaMigrateImportProgrammer;
    schema: OpenApi.IJsonSchema.IInteger;
  }): ts.TypeNode =>
    writeNumeric({
      factory: () => [
        TypeFactory.keyword("number"),
        props.importer.tag("Type", "int32"),
      ],
      importer: props.importer,
      schema: props.schema,
    });

  const writeNumber = (props: {
    importer: NestiaMigrateImportProgrammer;
    schema: OpenApi.IJsonSchema.INumber;
  }): ts.TypeNode =>
    writeNumeric({
      factory: () => [TypeFactory.keyword("number")],
      importer: props.importer,
      schema: props.schema,
    });

  const writeNumeric = (props: {
    factory: () => ts.TypeNode[];
    importer: NestiaMigrateImportProgrammer;
    schema: OpenApi.IJsonSchema.IInteger | OpenApi.IJsonSchema.INumber;
  }): ts.TypeNode => {
    const intersection: ts.TypeNode[] = props.factory();
    if (props.schema.default !== undefined)
      intersection.push(props.importer.tag("Default", props.schema.default));
    if (props.schema.minimum !== undefined)
      intersection.push(
        props.importer.tag(
          props.schema.exclusiveMinimum ? "ExclusiveMinimum" : "Minimum",
          props.schema.minimum,
        ),
      );
    if (props.schema.maximum !== undefined)
      intersection.push(
        props.importer.tag(
          props.schema.exclusiveMaximum ? "ExclusiveMaximum" : "Maximum",
          props.schema.maximum,
        ),
      );
    if (props.schema.multipleOf !== undefined)
      intersection.push(
        props.importer.tag("MultipleOf", props.schema.multipleOf),
      );
    writePlugin({
      importer: props.importer,
      regular: typia.misc.literals<keyof OpenApi.IJsonSchema.INumber>(),
      intersection,
      schema: props.schema,
    });
    return intersection.length === 1
      ? intersection[0]
      : ts.factory.createIntersectionTypeNode(intersection);
  };

  const writeString = (props: {
    importer: NestiaMigrateImportProgrammer;
    schema: OpenApi.IJsonSchema.IString;
  }): ts.TypeNode => {
    if (props.schema.format === "binary")
      return ts.factory.createTypeReferenceNode("File");

    const intersection: ts.TypeNode[] = [TypeFactory.keyword("string")];
    if (props.schema.default !== undefined)
      intersection.push(props.importer.tag("Default", props.schema.default));
    if (props.schema.minLength !== undefined)
      intersection.push(
        props.importer.tag("MinLength", props.schema.minLength),
      );
    if (props.schema.maxLength !== undefined)
      intersection.push(
        props.importer.tag("MaxLength", props.schema.maxLength),
      );
    if (props.schema.pattern !== undefined)
      intersection.push(props.importer.tag("Pattern", props.schema.pattern));
    if (
      props.schema.format !== undefined &&
      (FormatCheatSheet as Record<string, string>)[props.schema.format] !==
        undefined
    )
      intersection.push(props.importer.tag("Format", props.schema.format));
    if (props.schema.contentMediaType !== undefined)
      intersection.push(
        props.importer.tag("ContentMediaType", props.schema.contentMediaType),
      );
    writePlugin({
      importer: props.importer,
      regular: typia.misc.literals<keyof OpenApi.IJsonSchema.IString>(),
      intersection,
      schema: props.schema,
    });
    return intersection.length === 1
      ? intersection[0]
      : ts.factory.createIntersectionTypeNode(intersection);
  };

  /* -----------------------------------------------------------
    INSTANCES
  ----------------------------------------------------------- */
  const writeArray = (props: {
    components: OpenApi.IComponents;
    importer: NestiaMigrateImportProgrammer;
    schema: OpenApi.IJsonSchema.IArray;
  }): ts.TypeNode => {
    const intersection: ts.TypeNode[] = [
      ts.factory.createArrayTypeNode(
        write({
          components: props.components,
          importer: props.importer,
          schema: props.schema.items,
        }),
      ),
    ];
    if (props.schema.minItems !== undefined)
      intersection.push(props.importer.tag("MinItems", props.schema.minItems));
    if (props.schema.maxItems !== undefined)
      intersection.push(props.importer.tag("MaxItems", props.schema.maxItems));
    if (props.schema.uniqueItems === true)
      intersection.push(props.importer.tag("UniqueItems"));
    writePlugin({
      importer: props.importer,
      regular: typia.misc.literals<keyof OpenApi.IJsonSchema.IArray>(),
      intersection,
      schema: props.schema,
    });
    return intersection.length === 1
      ? intersection[0]
      : ts.factory.createIntersectionTypeNode(intersection);
  };

  const writeTuple = (props: {
    components: OpenApi.IComponents;
    importer: NestiaMigrateImportProgrammer;
    schema: OpenApi.IJsonSchema.ITuple;
  }): ts.TypeNode => {
    const tuple: ts.TypeNode = ts.factory.createTupleTypeNode([
      ...props.schema.prefixItems.map((item) =>
        write({
          components: props.components,
          importer: props.importer,
          schema: item,
        }),
      ),
      ...(typeof props.schema.additionalItems === "object" &&
      props.schema.additionalItems !== null
        ? [
            ts.factory.createRestTypeNode(
              write({
                components: props.components,
                importer: props.importer,
                schema: props.schema.additionalItems,
              }),
            ),
          ]
        : props.schema.additionalItems === true
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
      importer: props.importer,
      regular: typia.misc.literals<keyof OpenApi.IJsonSchema.ITuple>(),
      intersection,
      schema: props.schema,
    });
    return intersection.length === 1
      ? intersection[0]
      : ts.factory.createIntersectionTypeNode(intersection);
  };

  const writeObject = (props: {
    components: OpenApi.IComponents;
    importer: NestiaMigrateImportProgrammer;
    schema: OpenApi.IJsonSchema.IObject;
  }): ts.TypeNode => {
    const regular = () =>
      ts.factory.createTypeLiteralNode(
        Object.entries(props.schema.properties ?? [])
          .map(([key, value], index) => [
            ...(index !== 0 &&
            (!!value.title?.length || !!value.description?.length)
              ? [ts.factory.createIdentifier("\n") as any]
              : []),
            writeRegularProperty({
              components: props.components,
              importer: props.importer,
              required: props.schema.required ?? [],
              key,
              value,
            }),
          ])
          .flat(),
      );
    const dynamic = () =>
      ts.factory.createTypeLiteralNode([
        writeDynamicProperty({
          components: props.components,
          importer: props.importer,
          schema: props.schema.additionalProperties as OpenApi.IJsonSchema,
        }),
      ]);
    return !!props.schema.properties?.length &&
      typeof props.schema.additionalProperties === "object"
      ? ts.factory.createIntersectionTypeNode([regular(), dynamic()])
      : typeof props.schema.additionalProperties === "object"
        ? dynamic()
        : regular();
  };

  const writeRegularProperty = (props: {
    components: OpenApi.IComponents;
    importer: NestiaMigrateImportProgrammer;
    required: string[];
    key: string;
    value: OpenApi.IJsonSchema;
  }) =>
    FilePrinter.description(
      ts.factory.createPropertySignature(
        undefined,
        Escaper.variable(props.key)
          ? ts.factory.createIdentifier(props.key)
          : ts.factory.createStringLiteral(props.key),
        props.required.includes(props.key)
          ? undefined
          : ts.factory.createToken(ts.SyntaxKind.QuestionToken),
        write({
          components: props.components,
          importer: props.importer,
          schema: props.value,
        }),
      ),
      writeComment(props.value),
    );

  const writeDynamicProperty = (props: {
    components: OpenApi.IComponents;
    importer: NestiaMigrateImportProgrammer;
    schema: OpenApi.IJsonSchema;
  }) =>
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
        write(props),
      ),
      writeComment(props.schema),
    );

  const writeReference = (props: {
    importer: NestiaMigrateImportProgrammer;
    schema: OpenApi.IJsonSchema.IReference;
  }): ts.TypeReferenceNode | ts.KeywordTypeNode => {
    if (props.schema.$ref.startsWith("#/components/schemas") === false)
      return TypeFactory.keyword("any");
    const name: string = props.schema.$ref
      .split("/")
      .slice(3)
      .filter((str) => str.length !== 0)
      .map(StringUtil.escapeNonVariable)
      .join("");
    if (name === "") return TypeFactory.keyword("any");
    return props.importer.dto(name);
  };

  /* -----------------------------------------------------------
    UNIONS
  ----------------------------------------------------------- */
  const writeUnion = (props: {
    components: OpenApi.IComponents;
    importer: NestiaMigrateImportProgrammer;
    elements: OpenApi.IJsonSchema[];
  }): ts.UnionTypeNode =>
    ts.factory.createUnionTypeNode(
      props.elements.map((schema) =>
        write({
          components: props.components,
          importer: props.importer,
          schema,
        }),
      ),
    );
}
const createNode = (text: string) => ts.factory.createTypeReferenceNode(text);

const writeComment = (schema: OpenApi.IJsonSchema): string =>
  [
    ...(schema.description?.length
      ? [eraseCommentTags(schema.description)]
      : []),
    ...(schema.description?.length &&
    (schema.title !== undefined || schema.deprecated === true)
      ? [""]
      : []),
    ...(schema.title !== undefined ? [`@title ${schema.title}`] : []),
    ...(schema.deprecated === true ? [`@deprecated`] : []),
  ]
    .join("\n")
    .split("*/")
    .join("*\\/");

const eraseCommentTags = (description: string): string => {
  const lines: string[] = description.split("\n");
  return lines
    .filter((s) => COMMENT_TAGS.every((tag) => !s.includes(tag)))
    .join("\n");
};

const writePlugin = (props: {
  importer: NestiaMigrateImportProgrammer;
  regular: string[];
  intersection: ts.TypeNode[];
  schema: Record<string, any>;
}) => {
  const extra: any = {};
  for (const [key, value] of Object.entries(props.schema))
    if (
      value !== undefined &&
      false === props.regular.includes(key) &&
      key.startsWith("x-")
    )
      extra[key] = value;
  if (Object.keys(extra).length !== 0)
    props.intersection.push(props.importer.tag("JsonSchemaPlugin", extra));
};

const COMMENT_TAGS = [
  // string
  "@format",
  "@pattern",
  "@length",
  "@minLength",
  "@maxLength",
  "@contentMediaType",
  // number
  "@type",
  "@minimum",
  "@maximum",
  "@exclusiveMinimum",
  "@exclusiveMaximum",
  "@multipleOf",
  // array
  "@items",
  "@minItems",
  "@maxItems",
  "@uniqueItems",
];
