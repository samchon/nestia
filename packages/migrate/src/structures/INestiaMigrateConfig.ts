import { IHttpMigrateRoute } from "@samchon/openapi";
import ts from "typescript";

export interface INestiaMigrateConfig {
  simulate: boolean;
  e2e: boolean;
  package?: string;
  keyword?: boolean;
  author?: {
    tag: string;
    value: string;
  };
  programmer?: {
    controllerMethod?: (route: IHttpMigrateRoute) => ts.Block;
  };
}
