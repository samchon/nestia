import {
  IHttpMigrateApplication,
  OpenApi,
  OpenApiV3,
  OpenApiV3_1,
  SwaggerV2,
} from "@samchon/openapi";
import typia, { IValidation } from "typia";

import { MigrateApplicationAnalyzer } from "./analyzers/MigrateApplicationAnalyzer";
import { NEST_TEMPLATE } from "./bundles/NEST_TEMPLATE";
import { SDK_TEMPLATE } from "./bundles/SDK_TEMPLATE";
import { MigrateApiProgrammer } from "./programmers/MigrateApiProgrammer";
import { MigrateApiStartProgrammer } from "./programmers/MigrateApiStartProgrammer";
import { MigrateE2eProgrammer } from "./programmers/MigrateE2eProgrammer";
import { MigrateNestProgrammer } from "./programmers/MigrateNestProgrammer";
import { INestiaMigrateConfig } from "./structures/INestiaMigrateConfig";
import { INestiaMigrateContext } from "./structures/INestiaMigrateContext";
import { INestiaMigrateFile } from "./structures/INestiaMigrateFile";

export class NestiaMigrateApplication {
  public constructor(public readonly document: OpenApi.IDocument) {}

  public static assert(
    document:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApi.IDocument,
  ): NestiaMigrateApplication {
    return new NestiaMigrateApplication(
      OpenApi.convert(typia.assert(document)),
    );
  }

  public static validate(
    document:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApi.IDocument,
  ): IValidation<NestiaMigrateApplication> {
    const result: IValidation<
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApi.IDocument
    > = typia.validate(document);
    if (result.success === false) return result;
    return {
      success: true,
      data: new NestiaMigrateApplication(OpenApi.convert(document)),
    };
  }

  public nest(config: INestiaMigrateConfig): MigrateApplication.IOutput {
    const program: INestiaMigrateContext = MigrateApplicationAnalyzer.analyze(
      "nest",
      this.document,
      {
        simulate: config.simulate,
        e2e: config.e2e,
        author: config.author,
      },
    );
    const output: MigrateApplication.IOutput = {
      context: program,
      files: [
        ...NEST_TEMPLATE.filter(
          (f) =>
            f.location.startsWith("src/api/structures") === false &&
            f.location.startsWith("src/api/functional") === false &&
            f.location.startsWith("src/api/controllers") === false &&
            f.location.startsWith("test/features") === false,
        ),
        ...MigrateNestProgrammer.write(program),
        ...MigrateApiProgrammer.write(program),
        ...(config.e2e ? MigrateE2eProgrammer.write(program) : []),
      ],
      errors: program.errors,
    };
    return this.finalize(config, output);
  }

  public sdk(config: INestiaMigrateConfig): MigrateApplication.IOutput {
    const program: INestiaMigrateContext = MigrateApplicationAnalyzer.analyze(
      "sdk",
      this.document,
      config,
    );
    const output: MigrateApplication.IOutput = {
      context: program,
      files: [
        ...SDK_TEMPLATE.filter(
          (f) =>
            f.location.startsWith("src/structures") === false &&
            f.location.startsWith("src/functional") === false &&
            f.location.startsWith("test/features") === false,
        ),
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
    config: INestiaMigrateConfig,
    output: MigrateApplication.IOutput,
  ): MigrateApplication.IOutput {
    if (config.package)
      output.files = output.files.map((file) => ({
        ...file,
        content: file.content
          .split(`@ORGANIZATION/PROJECT`)
          .join(config.package),
      }));
    return output;
  }
}
export namespace MigrateApplication {
  export interface IOutput {
    context: INestiaMigrateContext;
    files: INestiaMigrateFile[];
    errors: IHttpMigrateApplication.IError[];
  }
}
