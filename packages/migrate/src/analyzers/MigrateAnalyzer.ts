import { IMigrateProgram } from "../structures/IMigrateProgram";
import { MigrateControllerAnalyzer } from "./MigrateControllerAnalyzer";

export namespace MigrateAnalyzer {
  export const analyze = (props: IMigrateProgram.IProps): IMigrateProgram => ({
    ...props,
    controllers: MigrateControllerAnalyzer.analyze(props),
  });
}
