import { IHttpMigrateApplication, OpenApi } from "@typia/interface";

import { INestiaMigrateConfig } from "./INestiaMigrateConfig";

export interface INestiaMigrateProgram {
  mode: "nest" | "sdk";
  document: OpenApi.IDocument;
  config: INestiaMigrateConfig;
  files: Record<string, string>;
  errors: IHttpMigrateApplication.IError[];
}
