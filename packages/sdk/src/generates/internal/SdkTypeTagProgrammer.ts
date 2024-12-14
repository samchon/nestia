import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";
import { LiteralFactory } from "typia/lib/factories/LiteralFactory";
import { IMetadataTypeTag } from "typia/lib/schemas/metadata/IMetadataTypeTag";

import { ImportDictionary } from "./ImportDictionary";

export namespace SdkTypeTagProgrammer {
  export const write = (
    importer: ImportDictionary,
    from: "object" | "array" | "boolean" | "number" | "bigint" | "string",
    tag: IMetadataTypeTag,
  ) => {
    const instance: string = tag.name.split("<")[0];
    if (PREDEFINED[from]?.has(instance) === true)
      return ts.factory.createTypeReferenceNode(
        importer.external({
          type: true,
          library: `typia/lib/tags/${instance}`,
          instance,
        }),
        instance === "Example"
          ? []
          : [
              ts.factory.createLiteralTypeNode(
                typeof tag.value === "boolean"
                  ? tag.value
                    ? ts.factory.createTrue()
                    : ts.factory.createFalse()
                  : typeof tag.value === "bigint"
                    ? tag.value < BigInt(0)
                      ? ts.factory.createPrefixUnaryExpression(
                          ts.SyntaxKind.MinusToken,
                          ts.factory.createBigIntLiteral(
                            (-tag.value).toString(),
                          ),
                        )
                      : ts.factory.createBigIntLiteral(tag.value.toString())
                    : typeof tag.value === "number"
                      ? ExpressionFactory.number(tag.value)
                      : ts.factory.createStringLiteral(tag.value),
              ),
            ],
      );
    return ts.factory.createTypeReferenceNode(
      importer.external({
        type: true,
        library: `typia/lib/tags/TagBase`,
        instance: "TagBase",
      }),
      [
        ts.factory.createLiteralTypeNode(
          LiteralFactory.write({
            target: from,
            kind: tag.kind,
            value: tag.value,
            validate: tag.validate,
            exclusive: tag.exclusive,
            schema: tag.schema,
          }) as any,
        ),
      ],
    );
  };
}

const COMMON_KINDS = ["Default", "Example", "Examples", "Sequence"];
const PREDEFINED = {
  object: new Set([...COMMON_KINDS]),
  array: new Set([...COMMON_KINDS, "MinItems", "MaxItems", "UniqueItems"]),
  boolean: new Set([...COMMON_KINDS]),
  number: new Set([
    ...COMMON_KINDS,
    "Minimum",
    "Maximum",
    "ExclusiveMinimum",
    "ExclusiveMaximum",
    "MultipleOf",
    "Type",
  ]),
  bigint: new Set([
    ...COMMON_KINDS,
    "Minimum",
    "Maximum",
    "ExclusiveMinimum",
    "ExclusiveMaximum",
    "MultipleOf",
    "Type",
  ]),
  string: new Set([
    ...COMMON_KINDS,
    "ContentMediaType",
    "Format",
    "MaxLength",
    "MinLength",
    "Pattern",
  ]),
};

// export * from "./Constant";
// export * from "./ContentMediaType";
// export * from "./Default";
// export * from "./Example";
// export * from "./Examples";
// export * from "./ExclusiveMaximum";
// export * from "./ExclusiveMinimum";
// export * from "./Format";
// export * from "./JsonSchemaPlugin";
// export * from "./Maximum";
// export * from "./MaxItems";
// export * from "./MaxLength";
// export * from "./Minimum";
// export * from "./MinItems";
// export * from "./MinLength";
// export * from "./MultipleOf";
// export * from "./Pattern";
// export * from "./Sequence";
// export * from "./TagBase";
// export * from "./Type";
// export * from "./UniqueItems";
