import { IJsonSchema } from "typia";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";

export interface ISwaggerSchemaTuple {
    metadata: Metadata;
    schema: IJsonSchema;
}
