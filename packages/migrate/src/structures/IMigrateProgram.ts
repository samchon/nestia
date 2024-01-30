import { IMigrateController } from "./IMigrateController";
import { ISwagger } from "./ISwagger";

export interface IMigrateProgram {
  controllers: IMigrateController[];
  swagger: ISwagger;
}
