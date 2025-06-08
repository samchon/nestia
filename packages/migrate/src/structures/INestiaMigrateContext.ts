import {
  IHttpMigrateApplication,
  IHttpMigrateRoute,
  OpenApi,
} from "@samchon/openapi";

import { INestiaMigrateConfig } from "./INestiaMigrateConfig";

export interface INestiaMigrateContext {
  mode: "nest" | "sdk";
  document: OpenApi.IDocument;
  config: INestiaMigrateConfig;
  routes: IHttpMigrateRoute[];
  errors: IHttpMigrateApplication.IError[];
}
