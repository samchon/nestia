import { Escaper } from "typia/lib/utils/Escaper";

import { ISwaggerSchema } from "../structures/ISwaggeSchema";
import { ISwaggerComponents } from "../structures/ISwaggerComponents";
import { JsonTypeChecker } from "../utils/JsonTypeChecker";
import { ImportProgrammer } from "./ImportProgrammer";

export namespace SchemaProgrammer {
    export const write =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (importer: ImportProgrammer) =>
        (schema: ISwaggerSchema): string =>
            writeSchema(components)(references)(importer)(() => () => {})(true)(
                schema,
            );

    type CommentTagger = (tag: string) => (value?: string) => void;

    const writeSchema =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (importer: ImportProgrammer) =>
        (commentTagger: CommentTagger) =>
        (final: boolean) =>
        (schema: ISwaggerSchema): string => {
            // SPECIAL TYPES
            if (JsonTypeChecker.isUnknown(schema)) return "any";

            const type: string = (() => {
                if (JsonTypeChecker.isAnyOf(schema))
                    return (
                        "(" +
                        schema.anyOf
                            .map(
                                writeSchema(components)(references)(importer)(
                                    commentTagger,
                                )(false),
                            )
                            .join(" | ") +
                        ")"
                    );
                else if (JsonTypeChecker.isOneOf(schema))
                    return schema.oneOf
                        .map(
                            writeSchema(components)(references)(importer)(
                                commentTagger,
                            )(false),
                        )
                        .join(" | ");
                // ATOMIC TYPES
                if (JsonTypeChecker.isNullOnly(schema)) return writeNullOnly();
                else if (JsonTypeChecker.isBoolean(schema))
                    return writeBoolean(importer)(commentTagger)(schema);
                else if (
                    JsonTypeChecker.isInteger(schema) ||
                    JsonTypeChecker.isNumber(schema)
                )
                    return writeNumber(importer)(commentTagger)(schema);
                else if (JsonTypeChecker.isString(schema))
                    return writeString(importer)(commentTagger)(schema);
                // INSTANCE TYPES
                else if (JsonTypeChecker.isArray(schema))
                    return writeArray(components)(references)(importer)(
                        commentTagger,
                    )(schema);
                else if (JsonTypeChecker.isObject(schema))
                    return writeObject(components)(references)(importer)(
                        schema,
                    );
                else if (JsonTypeChecker.isReference(schema)) {
                    references.push(schema);
                    return importer.dto(
                        schema.$ref.replace(`#/components/schemas/`, ``),
                    );
                } else return "any";
            })();
            if (type === "any" || final === false) return type;
            return isNullable(components)(schema) ? `null | ${type}` : type;
        };

    const isNullable =
        (components: ISwaggerComponents) =>
        (schema: ISwaggerSchema): boolean => {
            if (JsonTypeChecker.isAnyOf(schema))
                return schema.anyOf.some(isNullable(components));
            else if (JsonTypeChecker.isOneOf(schema))
                return schema.oneOf.some(isNullable(components));
            else if (JsonTypeChecker.isReference(schema)) {
                const $id = schema.$ref.replace("#/components/schemas/", "");
                const target = (components.schemas ?? {})[$id];
                return target === undefined
                    ? false
                    : isNullable(components)(target);
            }
            return (schema as ISwaggerSchema.IString).nullable === true;
        };

    const writeNullOnly = (): string => "null";

    const writeBoolean =
        (importer: ImportProgrammer) =>
        (tagger: CommentTagger) =>
        (schema: ISwaggerSchema.IBoolean): string => {
            if (schema.enum?.length) {
                if (schema.default !== undefined)
                    tagger("default")(schema.default.toString());
                return schema.enum.join(" | ");
            }
            const intersection: string[] = ["boolean"];
            if (schema.default !== undefined)
                intersection.push(
                    importer.tag("Default", String(schema.default)),
                );
            return intersection.length === 1
                ? intersection[0]
                : "(" + intersection.join(" & ") + ")";
        };

    const writeNumber =
        (importer: ImportProgrammer) =>
        (commentTagger: CommentTagger) =>
        (schema: ISwaggerSchema.IInteger | ISwaggerSchema.INumber): string => {
            if (schema.enum?.length) {
                if (schema.default !== undefined)
                    commentTagger("default")(schema.default.toString());
                return schema.enum.join(" | ");
            }

            const intersection: string[] = ["number"];
            if (schema.default !== undefined)
                intersection.push(importer.tag("Default", schema.default));
            if (schema.type === "integer")
                intersection.push(importer.tag("Type", "int32"));
            if (schema.minimum !== undefined)
                intersection.push(
                    importer.tag(
                        schema.exclusiveMinimum
                            ? "ExclusiveMinimum"
                            : "Minimum",
                        schema.minimum,
                    ),
                );
            if (schema.maximum !== undefined)
                intersection.push(
                    importer.tag(
                        schema.exclusiveMaximum
                            ? "ExclusiveMaximum"
                            : "Maximum",
                        schema.maximum,
                    ),
                );
            if (schema.multipleOf !== undefined)
                intersection.push(
                    importer.tag("MultipleOf", schema.multipleOf),
                );
            return intersection.length === 1
                ? intersection[0]
                : "(" + intersection.join(" & ") + ")";
        };
    const writeString =
        (importer: ImportProgrammer) =>
        (commentTagger: CommentTagger) =>
        (schema: ISwaggerSchema.IString): string => {
            if (schema.enum?.length) {
                if (schema.default !== undefined)
                    commentTagger("default")(schema.default.toString());
                return schema.enum
                    .map((str) => JSON.stringify(str))
                    .join(" | ");
            }

            const intersection: string[] = ["string"];
            if (schema.default !== undefined)
                intersection.push(importer.tag("Default", schema.default));
            if (schema.format !== undefined && FORMATS.has(schema.format))
                intersection.push(importer.tag("Format", schema.format));
            if (schema.pattern !== undefined)
                intersection.push(importer.tag("Pattern", schema.pattern));
            if (schema.minLength !== undefined)
                intersection.push(importer.tag("MinLength", schema.minLength));
            if (schema.maxLength !== undefined)
                intersection.push(importer.tag("MaxLength", schema.maxLength));
            return intersection.length === 1
                ? intersection[0]
                : "(" + intersection.join(" & ") + ")";
        };

    const writeArray =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (importer: ImportProgrammer) =>
        (commentTagger: CommentTagger) =>
        (schema: ISwaggerSchema.IArray): string => {
            if (schema["x-typia-tuple"])
                return `[${schema["x-typia-tuple"].items
                    .map(writeTupleElement(components)(references)(importer))
                    .join(", ")}]`;
            const intersection: string[] = [
                `Array<${writeSchema(components)(references)(importer)(
                    commentTagger,
                )(true)(schema.items)}>`,
            ];
            if (schema.minItems !== undefined)
                intersection.push(importer.tag("MinItems", schema.minItems));
            if (schema.maxItems !== undefined)
                intersection.push(importer.tag("MaxItems", schema.maxItems));

            return intersection.length === 1
                ? intersection[0]
                : "(" + intersection.join(" & ") + ")";
        };
    const writeTupleElement =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (importer: ImportProgrammer) =>
        (schema: ISwaggerSchema): string => {
            const name: string = writeSchema(components)(references)(importer)(
                () => () => {},
            )(true)(schema);
            return schema["x-typia-optional"]
                ? `${name}?`
                : schema["x-typia-rest"]
                ? `...${name}[]`
                : name;
        };

    const writeObject =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (importer: ImportProgrammer) =>
        (schema: ISwaggerSchema.IObject): string => {
            const entries = Object.entries(schema.properties ?? {});
            return typeof schema.additionalProperties === "object"
                ? entries.length
                    ? `${writeStaticObject(components)(references)(importer)(
                          schema,
                      )} & ${writeDynamicObject(components)(references)(
                          importer,
                      )(schema.additionalProperties)}`
                    : writeDynamicObject(components)(references)(importer)(
                          schema.additionalProperties,
                      )
                : writeStaticObject(components)(references)(importer)(schema);
        };
    const writeStaticObject =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (importer: ImportProgrammer) =>
        (schema: ISwaggerSchema.IObject): string =>
            [
                "{",
                ...Object.entries(schema.properties ?? {})
                    .map(([key, value]) =>
                        writeProperty(components)(references)(importer)(key)(
                            (schema.required ?? []).some((r) => r === key),
                        )(value),
                    )
                    .map(tab(4)),
                "}",
            ].join("\n");
    const writeDynamicObject =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (importer: ImportProgrammer) =>
        (additional: ISwaggerSchema): string => {
            return [
                "{",
                tab(4)(
                    writeProperty(components)(references)(importer)(
                        "[key: string]",
                        true,
                    )(true)(additional),
                ),
                "}",
            ].join("\n");
        };

    const writeProperty =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (importer: ImportProgrammer) =>
        (key: string, ensureVariable: boolean = false) =>
        (required: boolean) =>
        (schema: ISwaggerSchema): string => {
            const content: string[] = [];
            const commentTagger = (tag: string) => (value?: string) => {
                const exists: boolean =
                    (!!schema.description?.length &&
                        schema.description.includes(`@${tag}`)) ||
                    content.some((line) => line.includes(`@${tag}`));
                if (exists === false)
                    if (value?.length) content.push(`@${tag} ${value}`);
                    else content.push(`@${tag}`);
            };
            if (schema.description) {
                content.push(...schema.description.split("\n"));
                if (!schema.description.split("\n").at(-1)?.startsWith("@"))
                    content.push("");
            }

            // STARTS FROM TITLE
            if (schema.title) commentTagger("@title")(schema.title);

            // GET TYPE WITH SPECIAL TAGS
            const type: string =
                writeSchema(components)(references)(importer)(commentTagger)(
                    true,
                )(schema);

            // ENDS WITH DEPRECATED TAG
            if (schema.deprecated) commentTagger("@deprecated")();

            const description: string =
                content.length === 0
                    ? ""
                    : [
                          "/**",
                          ...content.map((line) => ` * ${line}`),
                          " */",
                          "",
                      ].join("\n");
            return `${description}${
                ensureVariable === false && Escaper.variable(key) === false
                    ? JSON.stringify(key)
                    : key
            }${required ? "" : "?"}: ${required ? type : `undefined | ${type}`};`;
        };

    const tab =
        (size: number) =>
        (str: string): string =>
            str
                .split("\n")
                .map((l) => `${" ".repeat(size)}${l}`)
                .join("\n");
}

const FORMATS = new Set([
    "email",
    "uuid",
    "ipv4",
    "ipv6",
    "url",
    "date",
    "date-time",
]);
