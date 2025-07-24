import { IHttpMigrateApplication } from "@samchon/openapi";

import { INestiaMigrateConfig } from "./INestiaMigrateConfig";

export interface INestiaMigrateContext {
  mode: "nest" | "sdk";
  application: IHttpMigrateApplication;
  config: INestiaMigrateConfig;
}
