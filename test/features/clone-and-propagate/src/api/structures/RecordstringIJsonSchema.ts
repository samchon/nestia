import type { IJsonSchema } from "./IJsonSchema";

/**
 * Construct a type with a set of properties K of type T
 */
export type RecordstringIJsonSchema = {
    [key: string]: IJsonSchema;
}