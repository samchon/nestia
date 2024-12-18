import { OpenApi, OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import typia, { IValidation } from "typia";

import { MigrateApplicationAnalyzer } from "./analyzers/MigrateApplicationAnalyzer";
import { NEST_TEMPLATE } from "./bundles/NEST_TEMPLATE";
import { SDK_TEMPLATE } from "./bundles/SDK_TEMPLATE";
import { MigrateApiProgrammer } from "./programmers/MigrateApiProgrammer";
import { MigrateApiStartProgrammer } from "./programmers/MigrateApiStartProgrammer";
import { MigrateE2eProgrammer } from "./programmers/MigrateE2eProgrammer";
import { MigrateNestProgrammer } from "./programmers/MigrateNestProgrammer";
import { IHttpMigrateFile } from "./structures/IHttpMigrateFile";
import { IHttpMigrateProgram } from "./structures/IHttpMigrateProgram";

export class MigrateApplication {
  private constructor(public readonly document: OpenApi.IDocument) {}

  public static create(
    document:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApi.IDocument,
  ): IValidation<MigrateApplication> {
    const result: IValidation<
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApi.IDocument
    > = typia.validate(document);
    if (result.success === false) return result;
    return {
      success: true,
      data: new MigrateApplication(OpenApi.convert(document)),
    };
  }

  public nest(config: MigrateApplication.IConfig): MigrateApplication.IOutput {
    const program: IHttpMigrateProgram = MigrateApplicationAnalyzer.analyze({
      mode: "nest",
      document: this.document,
      simulate: config.simulate,
      e2e: config.e2e,
    });
    const output: MigrateApplication.IOutput = {
      program,
      files: [
        ...NEST_TEMPLATE,
        ...MigrateNestProgrammer.write(program),
        ...MigrateApiProgrammer.write(program),
        ...(config.e2e ? MigrateE2eProgrammer.write(program) : []),
      ],
      errors: program.errors,
    };
    return this.finalize(config, output);
  }

  public sdk(config: MigrateApplication.IConfig): MigrateApplication.IOutput {
    const program: IHttpMigrateProgram = MigrateApplicationAnalyzer.analyze({
      mode: "sdk",
      document: this.document,
      simulate: config.simulate,
      e2e: config.e2e,
    });
    const output: MigrateApplication.IOutput = {
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
      errors: program.errors,
    };
    return this.finalize(config, output);
  }

  private finalize(
    config: MigrateApplication.IConfig,
    outupt: MigrateApplication.IOutput,
  ): MigrateApplication.IOutput {
    if (config.package)
      outupt.files = outupt.files.map((file) => ({
        ...file,
        content: file.content
          .split(`@ORGANIZATION/PROJECT`)
          .join(config.package),
      }));
    return outupt;
  }
}
export namespace MigrateApplication {
  export interface IOutput {
    program: IHttpMigrateProgram;
    files: IHttpMigrateFile[];
    errors: IHttpMigrateProgram.IError[];
  }
  export interface IConfig {
    simulate: boolean;
    e2e: boolean;
    package?: string;
  }
}
