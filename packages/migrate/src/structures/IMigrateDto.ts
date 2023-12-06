import { ISwaggerSchema } from "./ISwaggeSchema";

export interface IMigrateDto {
  name: string;
  location: string;
  schema: ISwaggerSchema | null;
  children: IMigrateDto[];
}
