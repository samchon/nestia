import { IMigrateConfig } from "../IMigrateConfig";
import { IMigrateProgram, ISwagger } from "../module";
import { ControllerAnalyzer } from "./ControllerAnalyzer";

export namespace MigrateAnalyzer {
  export const analyze =
    (config: IMigrateConfig) =>
    (swagger: ISwagger): IMigrateProgram => ({
      config,
      swagger,
      controllers: ControllerAnalyzer.analyze(swagger),
    });
}
