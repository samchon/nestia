import { type TypeNode, factory } from "@ttsc/factory";
import { IMetadataTypeTag } from "@typia/interface";

import { LiteralFactory } from "../../factories/LiteralFactory";
import { decodeTagValue } from "../../internal/legacy";
import { ImportDictionary } from "./ImportDictionary";

export namespace SdkTypeTagProgrammer {
  export type Target =
    | "object"
    | "array"
    | "boolean"
    | "number"
    | "bigint"
    | "string";

  /**
   * Writes a type tag of a cloned DTO.
   *
   * A tag prints as the predefined typia tag it matches, `tags.Minimum<3>`,
   * only when that tag accepts the argument and, given it, expands to exactly
   * the tag the metadata carries; then the two are the same type. Anything else
   * prints in the generic `tags.TagBase<{ ... }>` form, which is always the
   * same type.
   *
   * The tag's name cannot decide it. The SDK names a tag after its object type
   * with the brackets and quotes a component name drops, `Minimum3` or
   * `Formatuuid`, so a name no longer tells `tags.Minimum<3>` from a user's own
   * tag named alike (#1662). The expansion can: it is typia's declaration of
   * each predefined tag, and should typia change one, the tag only falls back
   * to the `TagBase` form.
   */
  export const write = (
    importer: ImportDictionary,
    from: Target,
    tag: IMetadataTypeTag,
  ): TypeNode => {
    const predefined: IPredefined | null =
      comment(from, tag) ?? recognize(from, tag);
    if (predefined !== null)
      return writePredefined(importer, predefined.name, predefined.argument);
    const value: unknown = decodeTagValue(tag);
    return factory.createTypeReferenceNode(
      factory.createQualifiedName(
        factory.createIdentifier(tagsOf(importer)),
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

  /** Writes the predefined typia tag `tags.<name><argument>`. */
  export const writePredefined = (
    importer: ImportDictionary,
    name: string,
    argument: unknown,
  ): TypeNode =>
    factory.createTypeReferenceNode(
      factory.createQualifiedName(
        factory.createIdentifier(tagsOf(importer)),
        factory.createIdentifier(name),
      ),
      [factory.createLiteralTypeNode(LiteralFactory.write(argument) as any)],
    );

  const tagsOf = (importer: ImportDictionary): string =>
    importer.external({
      declaration: true,
      file: `typia`,
      type: "element",
      name: "tags",
    });
}

interface IPredefined {
  name: string;
  argument: unknown;
}

/**
 * The predefined tag a JSDoc comment tag stands for.
 *
 * Typia names a comment tag, `@format uri`, after that tag with its brackets,
 * `Format<"uri">`, while a type tag's name has none, as the SDK's component
 * names drop them. The source has no type tag to equal, and a comment tag may
 * validate its own way, such as a format's inlined expression, so it prints as
 * the tag the comment names whenever the argument suits the tagged type.
 */
const comment = (
  from: SdkTypeTagProgrammer.Target,
  tag: IMetadataTypeTag,
): IPredefined | null => {
  if (tag.name.includes("<") === false) return null;
  const definition: IDefinition | undefined = DEFINITIONS[tag.kind];
  if (definition === undefined || tag.name.split("<")[0] !== definition.name)
    return null;
  const argument: unknown = argumentOf(definition, tag);
  return argument !== undefined && definition.expand(from, argument) !== null
    ? { name: definition.name, argument }
    : null;
};

/**
 * The typia tag the metadata's type tag is, with the argument that makes it, or
 * `null` when no predefined tag expands to it exactly.
 */
const recognize = (
  from: SdkTypeTagProgrammer.Target,
  tag: IMetadataTypeTag,
): IPredefined | null => {
  const definition: IDefinition | undefined = DEFINITIONS[tag.kind];
  if (definition === undefined) return null;
  const argument: unknown = argumentOf(definition, tag);
  if (argument === undefined) return null;
  const expected: IExpansion | null = definition.expand(from, argument);
  if (expected === null) return null;
  // the metadata holds the schema as JSON holds it
  return equals(expected.validate, tag.validate) &&
    equals(expected.exclusive, tag.exclusive) &&
    equals(json(expected.schema), tag.schema)
    ? { name: definition.name, argument }
    : null;
};

/**
 * The type argument a tag was written with: its value, or, for a tag whose
 * value is no literal, the schema member holding it. NaN has no literal type to
 * write, so it gives none.
 */
const argumentOf = (
  definition: IDefinition,
  tag: IMetadataTypeTag,
): unknown => {
  const value: unknown = decodeTagValue(tag);
  const argument: unknown =
    value === null || value === undefined
      ? definition.fallback?.(tag.schema as Record<string, unknown>)
      : value;
  return Number.isNaN(argument) ? undefined : argument;
};

/**
 * What a predefined tag, given its argument, bakes into the metadata. A tag
 * whose type parameter constraint rejects the argument expands to nothing.
 */
interface IExpansion {
  validate: string | undefined;
  exclusive: boolean | string[];
  schema: object;
}

interface IDefinition {
  name: string;
  expand: (
    from: SdkTypeTagProgrammer.Target,
    argument: unknown,
  ) => IExpansion | null;
  fallback?: (schema: Record<string, unknown> | undefined) => unknown;
}

/** `${Value}` of a numeric type argument, as a TypeScript template prints it. */
const numeral = (value: number | bigint): string =>
  typeof value === "bigint" ? `BigInt(${value})` : String(value);

const isNumeric = (value: unknown): value is number | bigint =>
  typeof value === "number" || typeof value === "bigint";

/**
 * A value as JSON holds it: a bigint as its number, as typia's `Numeric<Value>`
 * does, and a non-finite number as null, as `JSON.stringify` writes it.
 */
const json = (value: unknown): unknown =>
  typeof value === "bigint"
    ? Number(value)
    : typeof value === "number" && Number.isFinite(value) === false
      ? null
      : Array.isArray(value)
        ? value.map(json)
        : typeof value === "object" && value !== null
          ? Object.fromEntries(
              Object.entries(value).map(([key, v]) => [key, json(v)]),
            )
          : value;

const bound =
  (
    kind: string,
    exclusive: string[],
    validate: (value: string) => string,
  ): IDefinition["expand"] =>
  (from, argument) =>
    isNumeric(argument) &&
    from === (typeof argument === "bigint" ? "bigint" : "number")
      ? {
          validate: validate(numeral(argument)),
          exclusive,
          schema: { [kind]: json(argument) },
        }
      : null;

const TYPE_VALIDATE: Record<string, string | Record<string, string>> = {
  int8: `$importInternal("isTypeInt8")($input)`,
  uint8: `$importInternal("isTypeUint8")($input)`,
  int16: `$importInternal("isTypeInt16")($input)`,
  uint16: `$importInternal("isTypeUint16")($input)`,
  int32: `$importInternal("isTypeInt32")($input)`,
  uint32: `$importInternal("isTypeUint32")($input)`,
  int64: {
    number: `$importInternal("isTypeInt64")($input)`,
    bigint: `$importInternal("isTypeInt64Bigint")($input)`,
  },
  uint64: {
    number: `$importInternal("isTypeUint64")($input)`,
    bigint: `$importInternal("isTypeUint64Bigint")($input)`,
  },
  float: `$importInternal("isTypeFloat")($input)`,
  double: `true`,
};

/** `Format.Value` of typia's `Format` tag. */
const FORMATS: Set<string> = new Set([
  "byte",
  "password",
  "regex",
  "uuid",
  "email",
  "hostname",
  "idn-email",
  "idn-hostname",
  "iri",
  "iri-reference",
  "ipv4",
  "ipv6",
  "uri",
  "uri-reference",
  "uri-template",
  "url",
  "date-time",
  "date",
  "time",
  "duration",
  "json-pointer",
  "relative-json-pointer",
]);

/** `DefaultAtomic` of typia's `Default` tag. */
const isDefaultAtomic = (value: unknown): boolean =>
  typeof value === "boolean" ||
  typeof value === "bigint" ||
  typeof value === "number" ||
  typeof value === "string";

/** `PascalizeString` of typia's `Format` tag: `date-time` as `DateTime`. */
const pascalize = (value: string): string =>
  value.includes("-")
    ? value
        .split("-")
        .filter((word) => word.length !== 0)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join("")
    : value.charAt(0).toUpperCase() + value.slice(1);

/** `Serialize` of typia's `Pattern` tag, escaping as a string literal. */
const serialize = (value: string): string =>
  value.replace(
    /["\\\b\f\n\r\t]/g,
    (char) =>
      ({
        '"': '\\"',
        "\\": "\\\\",
        "\b": "\\b",
        "\f": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "\t": "\\t",
      })[char]!,
  );

/**
 * Every predefined typia tag, keyed by its kind, as `@typia/interface` declares
 * it.
 */
const DEFINITIONS: Record<string, IDefinition> = {
  minimum: {
    name: "Minimum",
    expand: bound(
      "minimum",
      ["minimum", "exclusiveMinimum"],
      (v) => `${v} <= $input`,
    ),
  },
  maximum: {
    name: "Maximum",
    expand: bound(
      "maximum",
      ["maximum", "exclusiveMaximum"],
      (v) => `$input <= ${v}`,
    ),
  },
  exclusiveMinimum: {
    name: "ExclusiveMinimum",
    expand: bound(
      "exclusiveMinimum",
      ["exclusiveMinimum", "minimum"],
      (v) => `${v} < $input`,
    ),
  },
  exclusiveMaximum: {
    name: "ExclusiveMaximum",
    expand: bound(
      "exclusiveMaximum",
      ["exclusiveMaximum", "maximum"],
      (v) => `$input < ${v}`,
    ),
  },
  multipleOf: {
    name: "MultipleOf",
    expand: (from, argument) =>
      isNumeric(argument) &&
      from === (typeof argument === "bigint" ? "bigint" : "number")
        ? {
            validate:
              typeof argument === "bigint"
                ? `$input % ${numeral(argument)} === ${numeral(BigInt(0))}`
                : `$importInternal("_isMultipleOf")($input, ${argument})`,
            exclusive: true,
            schema: { multipleOf: json(argument) },
          }
        : null,
  },
  type: {
    name: "Type",
    expand: (from, argument) => {
      if (typeof argument !== "string") return null;
      const validate = TYPE_VALIDATE[argument];
      if (validate === undefined) return null;
      const wide: boolean = argument === "int64" || argument === "uint64";
      if (from !== "number" && (wide === false || from !== "bigint"))
        return null;
      return {
        validate: typeof validate === "string" ? validate : validate[from],
        exclusive: true,
        schema: argument.startsWith("uint")
          ? { type: "integer", minimum: 0 }
          : { type: argument.startsWith("int") ? "integer" : "number" },
      };
    },
  },
  format: {
    name: "Format",
    expand: (from, argument) =>
      from === "string" && typeof argument === "string" && FORMATS.has(argument)
        ? {
            validate: `$importInternal("isFormat${pascalize(argument)}")($input)`,
            exclusive: ["format", "pattern"],
            schema: { format: argument },
          }
        : null,
  },
  pattern: {
    name: "Pattern",
    expand: (from, argument) =>
      from === "string" && typeof argument === "string"
        ? {
            validate: `RegExp("${serialize(argument)}").test($input)`,
            exclusive: ["format", "pattern"],
            schema: { pattern: argument },
          }
        : null,
  },
  minLength: {
    name: "MinLength",
    expand: (from, argument) =>
      from === "string" && typeof argument === "number"
        ? {
            validate: `$importInternal("_stringLengthGte")($input, ${argument})`,
            exclusive: true,
            schema: { minLength: argument },
          }
        : null,
  },
  maxLength: {
    name: "MaxLength",
    expand: (from, argument) =>
      from === "string" && typeof argument === "number"
        ? {
            validate: `$importInternal("_stringLengthLte")($input, ${argument})`,
            exclusive: true,
            schema: { maxLength: argument },
          }
        : null,
  },
  minItems: {
    name: "MinItems",
    expand: (from, argument) =>
      from === "array" && typeof argument === "number"
        ? {
            validate: `${argument} <= $input.length`,
            exclusive: true,
            schema: { minItems: argument },
          }
        : null,
  },
  maxItems: {
    name: "MaxItems",
    expand: (from, argument) =>
      from === "array" && typeof argument === "number"
        ? {
            validate: `$input.length <= ${argument}`,
            exclusive: true,
            schema: { maxItems: argument },
          }
        : null,
  },
  uniqueItems: {
    name: "UniqueItems",
    expand: (from, argument) =>
      from === "array" && typeof argument === "boolean"
        ? {
            validate: argument
              ? `$importInternal("isUniqueItems")($input)`
              : undefined,
            exclusive: true,
            schema: { uniqueItems: true },
          }
        : null,
  },
  contentMediaType: {
    name: "ContentMediaType",
    expand: (from, argument) =>
      from === "string" && typeof argument === "string"
        ? {
            validate: undefined,
            exclusive: false,
            schema: { contentMediaType: argument },
          }
        : null,
    fallback: (schema) => schema?.contentMediaType,
  },
  default: {
    name: "Default",
    expand: (from, argument) =>
      from ===
      (Array.isArray(argument)
        ? argument.every(isDefaultAtomic)
          ? "array"
          : null
        : typeof argument === "boolean"
          ? "boolean"
          : typeof argument === "bigint"
            ? "bigint"
            : typeof argument === "number"
              ? "number"
              : typeof argument === "string"
                ? "string"
                : null)
        ? {
            validate: undefined,
            exclusive: true,
            schema: { default: json(argument) },
          }
        : null,
    fallback: (schema) => schema?.default,
  },
  example: {
    name: "Example",
    expand: (_from, argument) => ({
      validate: undefined,
      exclusive: true,
      schema: {
        example: typeof argument === "bigint" ? Number(argument) : argument,
      },
    }),
    fallback: (schema) => schema?.example,
  },
  examples: {
    name: "Examples",
    expand: (_from, argument) =>
      typeof argument === "object" &&
      argument !== null &&
      Array.isArray(argument) === false &&
      Object.values(argument).every((value) => value !== undefined)
        ? {
            validate: undefined,
            exclusive: true,
            schema: { examples: argument },
          }
        : null,
    fallback: (schema) => schema?.examples,
  },
  sequence: {
    name: "Sequence",
    expand: (_from, argument) =>
      typeof argument === "number"
        ? {
            validate: undefined,
            exclusive: false,
            schema: { "x-protobuf-sequence": argument },
          }
        : null,
  },
};

/** Structural equality of metadata values, which hold bigints. */
const equals = (x: unknown, y: unknown): boolean => {
  if (x === y) return true;
  if (typeof x !== "object" || typeof y !== "object") return false;
  if (x === null || y === null) return false;
  if (Array.isArray(x) !== Array.isArray(y)) return false;
  const xKeys: string[] = Object.keys(x).filter(
    (key) => (x as Record<string, unknown>)[key] !== undefined,
  );
  const yKeys: string[] = Object.keys(y).filter(
    (key) => (y as Record<string, unknown>)[key] !== undefined,
  );
  return (
    xKeys.length === yKeys.length &&
    xKeys.every((key) =>
      equals(
        (x as Record<string, unknown>)[key],
        (y as Record<string, unknown>)[key],
      ),
    )
  );
};
