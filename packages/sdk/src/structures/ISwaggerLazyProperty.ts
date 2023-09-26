import { IJsonSchema } from "typia";

export interface ISwaggerLazyProperty {
    schema: IJsonSchema;
    object: string;
    property: string;
}
