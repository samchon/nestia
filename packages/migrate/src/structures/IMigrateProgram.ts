import { IMigrateConfig } from "../IMigrateConfig";
import { IMigrateController } from "./IMigrateController";
import { ISwagger } from "./ISwagger";

export interface IMigrateProgram {
  config: IMigrateConfig;
  controllers: IMigrateController[];
  swagger: ISwagger;
}
