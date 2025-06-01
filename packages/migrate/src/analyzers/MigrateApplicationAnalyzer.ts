import {
  HttpMigration,
  IHttpMigrateApplication,
  OpenApi,
} from "@samchon/openapi";

import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { INestiaMigrateContext } from "../structures/INestiaMigrateContext";

export namespace MigrateApplicationAnalyzer {
  export const analyze = (
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
}
