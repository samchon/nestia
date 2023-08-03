import { Escaper } from "typia/lib/utils/Escaper";

import { ISwaggerSchema } from "../structures/ISwaggeSchema";
import { ISwaggerComponents } from "../structures/ISwaggerComponents";
import { JsonTypeChecker } from "../utils/JsonTypeChecker";

export namespace SchemaProgrammer {
    export const write =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (schema: ISwaggerSchema): string =>
            writeSchema(components)(references)(() => () => {})(true)(schema);

    type Tagger = (tag: string) => (value?: string) => void;
    const writeSchema =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (tagger: Tagger) =>
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
                                writeSchema(components)(references)(tagger)(
                                    false,
                                ),
                            )
                            .join(" | ") +
                        ")"
                    );
                else if (JsonTypeChecker.isOneOf(schema))
                    return schema.oneOf
                        .map(writeSchema(components)(references)(tagger)(false))
                        .join(" | ");
                // ATOMIC TYPES
                else if (JsonTypeChecker.isBoolean(schema))
                    return writeBoolean(tagger)(schema);
                else if (JsonTypeChecker.isInteger(schema))
                    return writeInteger(tagger)(schema);
                else if (JsonTypeChecker.isNumber(schema))
                    return writeNumber(tagger)(schema);
                else if (JsonTypeChecker.isString(schema))
                    return writeString(tagger)(schema);
                // INSTANCE TYPES
                else if (JsonTypeChecker.isArray(schema))
                    return writeArray(components)(references)(tagger)(schema);
                else if (JsonTypeChecker.isObject(schema))
                    return writeObject(components)(references)(schema);
                else if (JsonTypeChecker.isReference(schema)) {
                    references.push(schema);
                    return schema.$ref.replace(`#/components/schemas/`, ``);
                } else return "any";
            })();
            if (type === "any" || final === false) return type;
            return isNullable(components)(schema) ? `${type} | null` : type;
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

    const writeBoolean =
        (tagger: Tagger) =>
        (schema: ISwaggerSchema.IBoolean): string => {
            if (schema.default) tagger("default")(schema.default.toString());
            return schema.enum ? schema.enum.join(" | ") : "boolean";
        };
    const writeInteger =
        (tagger: Tagger) =>
        (schema: ISwaggerSchema.IInteger): string => {
            tagger("type")("int");
            return writeNumber(tagger)(schema);
        };
    const writeNumber =
        (tagger: Tagger) =>
        (schema: ISwaggerSchema.IInteger | ISwaggerSchema.INumber): string => {
            if (schema.default) tagger("default")(schema.default.toString());
            if (schema.enum?.length) return schema.enum.join(" | ");

            if (schema.minimum !== undefined)
                tagger(
                    schema.exclusiveMinimum ? "exclusiveMinimum" : "minimum",
                )(schema.minimum.toString());
            if (schema.maximum !== undefined)
                tagger(
                    schema.exclusiveMaximum ? "exclusiveMaximum" : "maximum",
                )(schema.maximum.toString());
            if (schema.multipleOf !== undefined)
                tagger("multipleOf")(schema.multipleOf.toString());
            return "number";
        };
    const writeString =
        (tagger: Tagger) =>
        (schema: ISwaggerSchema.IString): string => {
            if (schema.default) tagger("default")(schema.default);
            if (schema.enum?.length)
                return schema.enum
                    .map((str) => JSON.stringify(str))
                    .join(" | ");

            if (schema.minLength !== undefined)
                tagger("minLength")(schema.minLength.toString());
            if (schema.maxLength !== undefined)
                tagger("maxLength")(schema.maxLength.toString());
            if (schema.pattern !== undefined) tagger("pattern")(schema.pattern);
            return "string";
        };

    const writeArray =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (tagger: Tagger) =>
        (schema: ISwaggerSchema.IArray): string =>
            schema["x-typia-tuple"]
                ? `[${schema["x-typia-tuple"].items
                      .map(writeTupleElement(components)(references))
                      .join(", ")}]`
                : `Array<${writeSchema(components)(references)(tagger)(true)(
                      schema.items,
                  )}>`;
    const writeTupleElement =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (schema: ISwaggerSchema): string => {
            const name: string = writeSchema(components)(references)(
                () => () => {},
            )(true)(schema);
            return schema["x-typia-optional"]
                ? `${name}?`
                : schema["x-typia-rest"]
                ? `...${name}`
                : name;
        };

    const writeObject =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (schema: ISwaggerSchema.IObject): string => {
            const entries = Object.entries(schema.properties ?? {});
            return typeof schema.additionalProperties === "object"
                ? entries.length
                    ? `${writeStaticObject(components)(references)(
                          schema,
                      )} & ${writeDynamicObject(components)(references)(
                          schema.additionalProperties,
                      )}`
                    : writeDynamicObject(components)(references)(
                          schema.additionalProperties,
                      )
                : writeStaticObject(components)(references)(schema);
        };
    const writeStaticObject =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (schema: ISwaggerSchema.IObject): string =>
            [
                "{",
                ...Object.entries(schema.properties ?? {})
                    .map(([key, value]) =>
                        writeProperty(components)(references)(key)(
                            (schema.required ?? []).some((r) => r === key),
                        )(value),
                    )
                    .map(tab(4)),
                "}",
            ].join("\n");
    const writeDynamicObject =
        (components: ISwaggerComponents) =>
        (references: ISwaggerSchema.IReference[]) =>
        (additional: ISwaggerSchema): string => {
            return [
                "{",
                tab(4)(
                    writeProperty(components)(references)(
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
        (key: string, ensureVariable: boolean = false) =>
        (required: boolean) =>
        (schema: ISwaggerSchema): string => {
            const content: string[] = [];
            const tagger = (tag: string) => (value?: string) => {
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
            if (schema.title) tagger("@title")(schema.title);

            // GET TYPE WITH SPECIAL TAGS
            const type: string =
                writeSchema(components)(references)(tagger)(true)(schema);

            // ENDS WITH DEPRECATED TAG
            if (schema.deprecated) tagger("@deprecated")();

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
            }${required ? "" : "?"}: ${type};`;
        };

    const tab =
        (size: number) =>
        (str: string): string =>
            str
                .split("\n")
                .map((l) => `${" ".repeat(size)}${l}`)
                .join("\n");
}
