import { OpenApi } from "@samchon/openapi";

export interface INestiaMigrateDto {
  name: string;
  location: string;
  schema: OpenApi.IJsonSchema | null;
  children: INestiaMigrateDto[];
}
