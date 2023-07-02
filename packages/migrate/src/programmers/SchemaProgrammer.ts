import { ISwaggerSchema } from "../structures/ISwaggeSchema";
import { JsonTypeChecker } from "../utils/JsonTypeChecker";

export namespace SchemaProgrammer {
    export const write = (schema: ISwaggerSchema): string =>
        writeSchema(() => () => {})(schema);

    type Tagger = (tag: string) => (value?: string) => void;
    const writeSchema =
        (tagger: Tagger) =>
        (schema: ISwaggerSchema): string => {
            // SPECIAL TYPES
            if (JsonTypeChecker.isUnknown(schema)) return "any";
            else if (JsonTypeChecker.isAnyOf(schema))
                return schema.anyOf.map(writeSchema(tagger)).join(" | ");
            else if (JsonTypeChecker.isOneOf(schema))
                return schema.oneOf.map(writeSchema(tagger)).join(" | ");
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
                return writeArray(tagger)(schema);
            else if (JsonTypeChecker.isObject(schema))
                return writeObject(schema);
            // NOTHING
            return "any";
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
            if (schema.enum?.length) return schema.enum.join(" | ");

            if (schema.minLength !== undefined)
                tagger("minLength")(schema.minLength.toString());
            if (schema.maxLength !== undefined)
                tagger("maxLength")(schema.maxLength.toString());
            if (schema.pattern !== undefined) tagger("pattern")(schema.pattern);
            return "string";
        };

    const writeArray =
        (tagger: Tagger) =>
        (schema: ISwaggerSchema.IArray): string =>
            schema["x-typia-tuple"]
                ? `[${schema["x-typia-tuple"].items
                      .map(writeTupleElement)
                      .join(", ")}]`
                : `Array<${writeSchema(tagger)(schema.items)}>`;
    const writeTupleElement = (schema: ISwaggerSchema): string => {
        const name: string = write(schema);
        return schema["x-typia-optional"]
            ? `${name}?`
            : schema["x-typia-rest"]
            ? `...${name}`
            : name;
    };

    const writeObject = (schema: ISwaggerSchema.IObject): string => {
        const entries = Object.entries(schema.properties);
        return typeof schema.additionalProperties === "object"
            ? entries.length
                ? `${writeStaticObject(schema)} & ${writeDynamicObject(
                      schema.additionalProperties,
                  )}`
                : writeDynamicObject(schema.additionalProperties)
            : writeStaticObject(schema);
    };
    const writeStaticObject = (schema: ISwaggerSchema.IObject): string =>
        [
            "{",
            ...Object.entries(schema.properties)
                .map(([key, value]) =>
                    writeProperty(key)(
                        (schema.required ?? []).some((r) => r === key),
                    )(value),
                )
                .map(tab(4))
                .join("\n"),
            "}",
        ].join("\n");
    const writeDynamicObject = (additional: ISwaggerSchema): string => {
        return [
            "{",
            tab(4)(writeProperty("[key: string]")(true)(additional)),
            "}",
        ].join("\n");
    };

    const writeProperty =
        (key: string) =>
        (required: boolean) =>
        (schema: ISwaggerSchema): string => {
            const content: string[] = (schema.description ?? "").split("\n");
            const tagger = (tag: string) => (value?: string) => {
                const exists: boolean =
                    (!!schema.description?.length &&
                        schema.description.includes(`@${tag}`)) ||
                    content.some((line) => line.includes(`@${tag}`));
                if (exists === false)
                    if (value?.length) content.push(`@${tag} ${value}`);
                    else content.push(`@${tag}`);
            };

            // STARTS FROM TITLE
            if (schema.title) tagger("@title")(schema.title);

            // GET TYPE WITH SPECIAL TAGS
            const type: string = writeSchema(tagger)(schema);

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
            return `${description}${key}${required ? "" : "?"}: ${type};`;
        };

    const tab =
        (size: number) =>
        (str: string): string =>
            str
                .split("\n")
                .map((l) => `${" ".repeat(size)}${l}`)
                .join("\n");
}
