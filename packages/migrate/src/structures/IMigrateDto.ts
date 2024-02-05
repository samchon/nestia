import { ISwaggerSchema } from "./ISwaggerSchema";

export interface IMigrateDto {
  name: string;
  location: string;
  schema: ISwaggerSchema | null;
  children: IMigrateDto[];
}
