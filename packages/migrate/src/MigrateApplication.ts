import typia from "typia";

import { MigrateAnalyzer } from "./analyzers/MigrateAnalyzer";
import { NEST_TEMPLATE } from "./bundles/NEST_TEMPLATE";
import { SDK_TEMPLATE } from "./bundles/SDK_TEMPLATE";
import { IMigrateProgram } from "./module";
import { MigrateApiProgrammer } from "./programmers/MigrateApiProgrammer";
import { MigrateNestProgrammer } from "./programmers/MigrateNestProgrammer";
import { IMigrateFile } from "./structures/IMigrateFile";
import { ISwagger } from "./structures/ISwagger";

export class MigrateApplication {
  public readonly swagger: ISwagger;

  public constructor(swagger: ISwagger) {
    this.swagger = typia.assert(swagger);
  }

  public nest(simulate: boolean): MigrateApplication.IOutput {
    const program: IMigrateProgram = MigrateAnalyzer.analyze({
      mode: "nest",
      simulate,
      swagger: this.swagger,
      dictionary: new Map(),
    });
    return {
      program,
      files: [
        ...NEST_TEMPLATE,
        ...MigrateNestProgrammer.write(program),
        ...MigrateApiProgrammer.write(program),
      ],
    };
  }

  public sdk(simulate: boolean): MigrateApplication.IOutput {
    const program: IMigrateProgram = MigrateAnalyzer.analyze({
      mode: "sdk",
      simulate,
      swagger: this.swagger,
      dictionary: new Map(),
    });
    return {
      program,
      files: [...SDK_TEMPLATE, ...MigrateApiProgrammer.write(program)],
    };
  }
}
export namespace MigrateApplication {
  export interface IOutput {
    program: IMigrateProgram;
    files: IMigrateFile[];
  }
}
