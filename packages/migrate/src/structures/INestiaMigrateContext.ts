import { IHttpMigrateApplication } from "@typia/interface";

import { INestiaMigrateConfig } from "./INestiaMigrateConfig";

export interface INestiaMigrateContext {
  mode: "nest" | "sdk";
  application: IHttpMigrateApplication;
  config: INestiaMigrateConfig;
}
