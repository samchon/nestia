import { OpenApi } from "@samchon/openapi";

export interface IHttpMigrateDto {
  name: string;
  location: string;
  schema: OpenApi.IJsonSchema | null;
  children: IHttpMigrateDto[];
}
