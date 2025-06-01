import { IHttpMigrateApplication, OpenApi } from "@samchon/openapi";

import { INestiaMigrateConfig } from "./INestiaMigrateConfig";

export interface INestiaMigrateProgram {
  mode: "nest" | "sdk";
  document: OpenApi.IDocument;
  config: INestiaMigrateConfig;
  files: Record<string, string>;
  errors: IHttpMigrateApplication.IError[];
}
