import { OpenApi } from "@samchon/openapi";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";

export interface ISwaggerLazySchema {
  metadata: Metadata;
  schema: OpenApi.IJsonSchema;
}
