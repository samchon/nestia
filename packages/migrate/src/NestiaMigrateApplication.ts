import {
  HttpMigration,
  IHttpMigrateApplication,
  OpenApi,
  OpenApiV3,
  OpenApiV3_1,
  SwaggerV2,
} from "@samchon/openapi";
import typia, { IValidation } from "typia";

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
  private readonly application_: IHttpMigrateApplication;

  public constructor(public readonly document: OpenApi.IDocument) {
    this.application_ = HttpMigration.application(document);
  }

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

  public getErrors(): IHttpMigrateApplication.IError[] {
    return this.application_.errors;
  }

  public nest(config: INestiaMigrateConfig): Record<string, string> {
    const context: INestiaMigrateContext = createContext(
      "nest",
      this.document,
      {
        simulate: config.simulate,
        e2e: config.e2e,
        author: config.author,
      },
    );
    const files: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(NEST_TEMPLATE).filter(
          ([key]) =>
            key.startsWith("src/api/structures") === false &&
            key.startsWith("src/api/functional") === false &&
            key.startsWith("src/api/controllers") === false &&
            key.startsWith("test/features") === false,
        ),
      ),
      ...MigrateNestProgrammer.write(context),
      ...MigrateApiProgrammer.write(context),
      ...(config.e2e ? MigrateE2eProgrammer.write(context) : {}),
    };
    return config.package ? this.rename(config.package, files) : files;
  }

  public sdk(config: INestiaMigrateConfig): Record<string, string> {
    const context: INestiaMigrateContext = createContext(
      "sdk",
      this.document,
      config,
    );
    const files: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(SDK_TEMPLATE).filter(
          ([key]) =>
            key.startsWith("src/structures") === false &&
            key.startsWith("src/functional") === false &&
            key.startsWith("test/features") === false,
        ),
      ),
      ...MigrateApiProgrammer.write(context),
      ...MigrateApiStartProgrammer.write(context),
      ...(config.e2e ? MigrateE2eProgrammer.write(context) : {}),
      "swagger.json": JSON.stringify(this.document, null, 2),
    };
    return config.package ? this.rename(config.package, files) : files;
  }

  private rename(
    slug: string,
    files: Record<string, string>,
  ): Record<string, string> {
    return Object.fromEntries(
      Object.entries(files).map(([key, value]) => [
        key,
        value.split(`@ORGANIZATION/PROJECT`).join(slug),
      ]),
    );
  }
}
export namespace MigrateApplication {
  export interface IOutput {
    context: INestiaMigrateContext;
    files: INestiaMigrateFile[];
    errors: IHttpMigrateApplication.IError[];
  }
}

const createContext = (
  mode: "nest" | "sdk",
  document: OpenApi.IDocument,
  config: INestiaMigrateConfig,
): INestiaMigrateContext => {
  const application: IHttpMigrateApplication =
    HttpMigration.application(document);
  return {
    mode,
    document,
    config,
    routes: application.routes,
    errors: application.errors,
  };
};
