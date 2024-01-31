import { IMigrateProgram, ISwagger } from "../module";
import { ControllerAnalyzer } from "./ControllerAnalyzer";

export namespace MigrateAnalyzer {
  export const analyze = (swagger: ISwagger): IMigrateProgram => ({
    swagger,
    controllers: ControllerAnalyzer.analyze(swagger),
  });
}
