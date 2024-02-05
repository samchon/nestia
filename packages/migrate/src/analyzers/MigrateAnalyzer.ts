import { IMigrateConfig } from "../IMigrateConfig";
import { IMigrateProgram, ISwagger } from "../module";
import { MigrateControllerAnalyzer } from "./MigrateControllerAnalyzer";

export namespace MigrateAnalyzer {
  export const analyze =
    (config: IMigrateConfig) =>
    (swagger: ISwagger): IMigrateProgram => ({
      config,
      swagger,
      controllers: MigrateControllerAnalyzer.analyze(swagger),
    });
}
