import { ISwaggerSchema } from "../structures/ISwaggeSchema";

export namespace JsonTypeChecker {
    export const isAnyOf = (
        schema: ISwaggerSchema,
    ): schema is ISwaggerSchema.IAnyOf => (schema as any).anyOf !== undefined;

    export const isOneOf = (
        schema: ISwaggerSchema,
    ): schema is ISwaggerSchema.IOneOf => (schema as any).oneOf !== undefined;

    export const isNullOnly = (
        schema: ISwaggerSchema,
    ): schema is ISwaggerSchema.INullOnly => (schema as any).type === "null";

    export const isBoolean = (
        schema: ISwaggerSchema,
    ): schema is ISwaggerSchema.IBoolean => (schema as any).type === "boolean";

    export const isInteger = (
        schema: ISwaggerSchema,
    ): schema is ISwaggerSchema.IInteger => (schema as any).type === "integer";

    export const isNumber = (
        schema: ISwaggerSchema,
    ): schema is ISwaggerSchema.INumber => (schema as any).type === "number";

    export const isString = (
        schema: ISwaggerSchema,
    ): schema is ISwaggerSchema.IString => (schema as any).type === "string";

    export const isArray = (
        schema: ISwaggerSchema,
    ): schema is ISwaggerSchema.IArray => (schema as any).type === "array";

    export const isObject = (
        schema: ISwaggerSchema,
    ): schema is ISwaggerSchema.IObject => (schema as any).type === "object";

    export const isReference = (
        schema: ISwaggerSchema,
    ): schema is ISwaggerSchema.IReference =>
        (schema as any).$ref !== undefined;

    export const isUnknown = (
        schema: ISwaggerSchema,
    ): schema is ISwaggerSchema.IUnknown =>
        (schema as any).type === undefined &&
        !isAnyOf(schema) &&
        !isOneOf(schema) &&
        !isReference(schema);
}
