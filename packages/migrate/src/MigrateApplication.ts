import typia, { IValidation } from "typia";

import { MigrateAnalyzer } from "./analyzers/MigrateAnalyzer";
import { NEST_TEMPLATE } from "./bundles/NEST_TEMPLATE";
import { SDK_TEMPLATE } from "./bundles/SDK_TEMPLATE";
import { MigrateApiProgrammer } from "./programmers/MigrateApiProgrammer";
import { MigrateApiStartProgrammer } from "./programmers/MigrateApiStartProgrammer";
import { MigrateE2eProgrammer } from "./programmers/MigrateE2eProgrammer";
import { MigrateNestProgrammer } from "./programmers/MigrateNestProgrammer";
import { IMigrateFile } from "./structures/IMigrateFile";
import { IMigrateProgram } from "./structures/IMigrateProgram";
import { ISwagger } from "./structures/ISwagger";

export class MigrateApplication {
  private constructor(public readonly swagger: ISwagger) {}

  public static create(swagger: ISwagger): IValidation<MigrateApplication> {
    const result = typia.validate<ISwagger>(swagger);
    if (result.success)
      return {
        success: true,
        data: new MigrateApplication(swagger),
        errors: [],
      };
    return result;
  }

  public nest(config: MigrateApplication.IConfig): MigrateApplication.IOutput {
    const program: IMigrateProgram = MigrateAnalyzer.analyze({
      mode: "nest",
      swagger: this.swagger,
      dictionary: new Map(),
      simulate: config.simulate,
      e2e: config.e2e,
    });
    return {
      program,
      files: [
        ...NEST_TEMPLATE,
        ...MigrateNestProgrammer.write(program),
        ...MigrateApiProgrammer.write(program),
        ...(config.e2e ? MigrateE2eProgrammer.write(program) : []),
      ],
    };
  }

  public sdk(config: MigrateApplication.IConfig): MigrateApplication.IOutput {
    const program: IMigrateProgram = MigrateAnalyzer.analyze({
      mode: "sdk",
      swagger: this.swagger,
      dictionary: new Map(),
      simulate: config.simulate,
      e2e: config.e2e,
    });
    return {
      program,
      files: [
        ...SDK_TEMPLATE,
        ...MigrateApiProgrammer.write(program),
        MigrateApiStartProgrammer.write(program),
        ...(config.e2e ? MigrateE2eProgrammer.write(program) : []),
      ],
    };
  }
}
export namespace MigrateApplication {
  export interface IOutput {
    program: IMigrateProgram;
    files: IMigrateFile[];
  }
  export interface IConfig {
    simulate: boolean;
    e2e: boolean;
  }
}
