import typia from "typia";

import { MigrateAnalyzer } from "./analyzers/MigrateAnalyzer";
import { NEST_TEMPLATE } from "./bundles/NEST_TEMPLATE";
import { SDK_TEMPLATE } from "./bundles/SDK_TEMPLATE";
import { ApiProgrammer } from "./programmers/ApiProgrammer";
import { NestProgrammer } from "./programmers/NestProgrammer";
import { IMigrateFile } from "./structures/IMigrateFile";
import { ISwagger } from "./structures/ISwagger";

export class MigrateApplication {
  public constructor(public readonly swagger: ISwagger) {
    typia.assert(swagger);
  }

  public nest(simulate: boolean): IMigrateFile[] {
    const program = MigrateAnalyzer.analyze({
      mode: "nest",
      simulate,
    })(this.swagger);
    return [
      ...NEST_TEMPLATE,
      ...NestProgrammer.write(program),
      ...ApiProgrammer.write(program),
    ];
  }

  public sdk(simulate: boolean): IMigrateFile[] {
    const program = MigrateAnalyzer.analyze({
      mode: "sdk",
      simulate,
    })(this.swagger);
    return [...SDK_TEMPLATE, ...ApiProgrammer.write(program)];
  }
}
