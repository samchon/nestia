import { IHttpMigrateRoute } from "@samchon/openapi";

export interface INestiaMigrateController {
  name: string;
  path: string;
  location: string;
  routes: IHttpMigrateRoute[];
}
