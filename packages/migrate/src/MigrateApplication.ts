import { OpenApi, OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
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

export class MigrateApplication {
  private constructor(public readonly document: OpenApi.IDocument) {}

  public static async create(
    document: SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument,
  ): Promise<IValidation<MigrateApplication>> {
    const result = typia.validate(document);
    if (result.success === false) return result;
    return {
      success: true,
      data: new MigrateApplication(OpenApi.convert(document)),
      errors: [],
    };
  }

  public nest(config: MigrateApplication.IConfig): MigrateApplication.IOutput {
    const program: IMigrateProgram = MigrateAnalyzer.analyze({
      mode: "nest",
      document: this.document,
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
      document: this.document,
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
        {
          location: "",
          file: "swagger.json",
          content: JSON.stringify(this.document, null, 2),
        },
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
