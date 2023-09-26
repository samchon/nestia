import { IJsonSchema } from "typia";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";

export interface ISwaggerLazySchema {
    metadata: Metadata;
    schema: IJsonSchema;
}
