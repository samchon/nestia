import typia from "typia";

import { MigrateAnalyzer } from "./analyzers/MigrateAnalyzer";
import { NEST_TEMPLATE } from "./bundles/NEST_TEMPLATE";
import { SDK_TEMPLATE } from "./bundles/SDK_TEMPLATE";
import { IMigrateProgram } from "./module";
import { MigrateApiProgrammer } from "./programmers/MigrateApiProgrammer";
import { MigrateApiStartProgrammer } from "./programmers/MigrateApiStartProgrammer";
import { MigrateE2eProgrammer } from "./programmers/MigrateE2eProgrammer";
import { MigrateNestProgrammer } from "./programmers/MigrateNestProgrammer";
import { IMigrateFile } from "./structures/IMigrateFile";
import { ISwagger } from "./structures/ISwagger";

export class MigrateApplication {
  public readonly swagger: ISwagger;

  public constructor(swagger: ISwagger) {
    this.swagger = typia.assert(swagger);
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
