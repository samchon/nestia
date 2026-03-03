import { OpenApi } from "@typia/interface";

export interface INestiaMigrateDto {
  name: string;
  location: string;
  schema: OpenApi.IJsonSchema | null;
  children: INestiaMigrateDto[];
}
