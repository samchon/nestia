import { type TypeNode, factory } from "@ttsc/factory";
import { IMetadataTypeTag } from "@typia/interface";

import { LiteralFactory } from "../../factories/LiteralFactory";
import { decodeTagValue } from "../../internal/legacy";
import { ImportDictionary } from "./ImportDictionary";

export namespace SdkTypeTagProgrammer {
  export const write = (
    importer: ImportDictionary,
    from: "object" | "array" | "boolean" | "number" | "bigint" | "string",
    tag: IMetadataTypeTag,
  ): TypeNode => {
    const name: string = tag.name.split("<")[0]!;
    const value: unknown = decodeTagValue(tag);
    if (PREDEFINED[from]?.has(name) === true && isWritable(name, value))
      return factory.createTypeReferenceNode(
        factory.createQualifiedName(
          factory.createIdentifier(
            importer.external({
              declaration: true,
              file: `typia`,
              type: "element",
              name: "tags",
            }),
          ),
          factory.createIdentifier(name),
        ),
        [factory.createLiteralTypeNode(LiteralFactory.write(value) as any)],
      );
    return factory.createTypeReferenceNode(
      factory.createQualifiedName(
        factory.createIdentifier(
          importer.external({
            declaration: true,
            file: `typia`,
            type: "element",
            name: "tags",
          }),
        ),
        factory.createIdentifier("TagBase"),
      ),
      [
        factory.createLiteralTypeNode(
          LiteralFactory.write({
            target: from,
            kind: tag.kind,
            value: Number.isNaN(value) ? null : value,
            validate: tag.validate,
            exclusive: tag.exclusive,
            schema: tag.schema,
          }) as any,
        ),
      ],
    );
  };
}

/**
 * Whether a predefined tag can take the value as its type argument. A bound
 * takes a number or bigint literal, and NaN has no literal type at all: a NaN
 * enum member passed to a tag, `tags.Minimum<Weird.NaN>`, arrives as NaN. Such
 * a tag is written in the generic `TagBase` form instead, with a null value,
 * which keeps its `validate` and `schema` as they are.
 */
const isWritable = (name: string, value: unknown): boolean =>
  Number.isNaN(value) === false &&
  (BOUNDS.has(name) === false ||
    typeof value === "number" ||
    typeof value === "bigint");

const BOUNDS = new Set([
  "Minimum",
  "Maximum",
  "ExclusiveMinimum",
  "ExclusiveMaximum",
  "MultipleOf",
]);
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
