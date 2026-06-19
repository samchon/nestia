import {
  IHttpMigrateApplication,
  OpenApi,
  OpenApiV3,
  OpenApiV3_1,
  OpenApiV3_2,
  SwaggerV2,
} from "@typia/interface";
import { HttpMigration, OpenApiConverter } from "@typia/utils";
import typia, { IValidation } from "typia";

import { NEST_TEMPLATE } from "./bundles/NEST_TEMPLATE";
import { SDK_TEMPLATE } from "./bundles/SDK_TEMPLATE";
import { NestiaMigrateApiProgrammer } from "./programmers/NestiaMigrateApiProgrammer";
import { NestiaMigrateApiStartProgrammer } from "./programmers/NestiaMigrateApiStartProgrammer";
import { NestiaMigrateE2eProgrammer } from "./programmers/NestiaMigrateE2eProgrammer";
import { NestiaMigrateNestProgrammer } from "./programmers/NestiaMigrateNestProgrammer";
import { INestiaMigrateConfig } from "./structures/INestiaMigrateConfig";
import { INestiaMigrateContext } from "./structures/INestiaMigrateContext";
import { INestiaMigrateFile } from "./structures/INestiaMigrateFile";

export class NestiaMigrateApplication {
  private readonly data_: IHttpMigrateApplication;

  /* -----------------------------------------------------------
    CONSTRUCTORS
  ----------------------------------------------------------- */
  public constructor(public readonly document: OpenApi.IDocument) {
    this.data_ = HttpMigration.application(document);
  }

  public static assert(
    document:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApiV3_2.IDocument
      | OpenApi.IDocument,
  ): NestiaMigrateApplication {
    return new NestiaMigrateApplication(
      OpenApiConverter.upgradeDocument(typia.assert(document)),
    );
  }

  public static validate(
    document:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApiV3_2.IDocument
      | OpenApi.IDocument,
  ): IValidation<NestiaMigrateApplication> {
    const result: IValidation<
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApiV3_2.IDocument
      | OpenApi.IDocument
    > = typia.validate(document);
    if (result.success === false) return result;
    return {
      success: true,
      data: new NestiaMigrateApplication(
        OpenApiConverter.upgradeDocument(document),
      ),
    };
  }

  /* -----------------------------------------------------------
    ACCESSORS
  ----------------------------------------------------------- */
  public getData(): IHttpMigrateApplication {
    return this.data_;
  }

  /** @deprecated */
  public getErrors(): IHttpMigrateApplication.IError[] {
    return this.data_.errors;
  }

  public nest(config: INestiaMigrateConfig): Record<string, string> {
    const context: INestiaMigrateContext = createContext(
      "nest",
      this.data_,
      config,
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
      ...NestiaMigrateNestProgrammer.write(context),
      ...NestiaMigrateApiProgrammer.write(context),
      ...(config.e2e ? NestiaMigrateE2eProgrammer.write(context) : {}),
      ...(config.keyword === false
        ? {
            "nestia.config.ts": NEST_TEMPLATE["nestia.config.ts"]!.replace(
              "keyword: true",
              "keyword: false",
            ),
          }
        : {}),
    };
    return config.package ? renameSlug(config.package, files) : files;
  }

  public sdk(config: INestiaMigrateConfig): Record<string, string> {
    const context: INestiaMigrateContext = createContext(
      "sdk",
      this.data_,
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
      ...NestiaMigrateApiProgrammer.write(context),
      ...NestiaMigrateApiStartProgrammer.write(context),
      ...(config.e2e ? NestiaMigrateE2eProgrammer.write(context) : {}),
      "swagger.json": JSON.stringify(this.document, null, 2),
    };
    return config.package ? renameSlug(config.package, files) : files;
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
  application: IHttpMigrateApplication,
  config: INestiaMigrateConfig,
): INestiaMigrateContext => {
  return {
    mode,
    application: {
      ...application,
      routes: application.routes.filter((r) => r.method !== "query"),
    },
    config,
  };
};

const renameSlug = (
  slug: string,
  files: Record<string, string>,
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(files).map(([key, value]) => [
      key,
      value.split(`@ORGANIZATION/PROJECT`).join(slug),
    ]),
  );
};
