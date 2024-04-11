import { OpenApi } from "@samchon/openapi";

export interface IMigrateDto {
  name: string;
  location: string;
  schema: OpenApi.IJsonSchema | null;
  children: IMigrateDto[];
}
