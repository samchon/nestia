import { OpenApi } from "@samchon/openapi";

export interface ISwaggerLazyProperty {
  schema: OpenApi.IJsonSchema;
  object: string;
  property: string;
}
