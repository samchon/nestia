import { IMigrateController } from "./IMigrateController";
import { IMigrateDto } from "./IMigrateDto";

export interface IMigrateProgram {
  controllers: IMigrateController[];
  structures: IMigrateDto[];
}
