import { ISwaggerSchema } from "../structures/ISwaggeSchema";
import { JsonTypeChecker } from "../utils/JsonTypeChecker";

export namespace SchemaProgrammer {
    export const write = (schema: ISwaggerSchema): string => {
        // SPECIAL TYPES
        if (JsonTypeChecker.isUnknown(schema)) return "any";
        else if (JsonTypeChecker.isAnyOf(schema))
            return schema.anyOf.map(write).join(" | ");
        else if (JsonTypeChecker.isOneOf(schema))
            return schema.oneOf.map(write).join(" | ");
        // ATOMIC TYPES
        else if (JsonTypeChecker.isBoolean(schema))
            return schema.enum ? schema.enum.join(" | ") : "boolean";
        else if (JsonTypeChecker.isInteger(schema))
            return schema.enum ? schema.enum.join(" | ") : "number";
        else if (JsonTypeChecker.isNumber(schema))
            return schema.enum ? schema.enum.join(" | ") : "number";
        else if (JsonTypeChecker.isString(schema))
            return schema.enum ? schema.enum.join(" | ") : "string";
        // INSTANCE TYPES
        else if (JsonTypeChecker.isArray(schema)) return writeArray(schema);
        else if (JsonTypeChecker.isObject(schema)) return writeObject(schema);
        // NOTHING
        return "any";
    };

    const writeArray = (schema: ISwaggerSchema.IArray): string =>
        schema["x-typia-tuple"]
            ? `[${schema["x-typia-tuple"].items
                  .map(writeTupleElement)
                  .join(", ")}]`
            : `Array<${write(schema.items)}>`;

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
            return `${key}${required ? "" : "?"}: ${write(schema)};`;
        };

    const tab =
        (size: number) =>
        (str: string): string =>
            str
                .split("\n")
                .map((l) => `${" ".repeat(size)}${l}`)
                .join("\n");
}
