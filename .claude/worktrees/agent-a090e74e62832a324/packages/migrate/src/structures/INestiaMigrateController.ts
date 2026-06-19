import { IHttpMigrateRoute } from "@typia/interface";

export interface INestiaMigrateController {
  name: string;
  path: string;
  location: string;
  routes: IHttpMigrateRoute[];
}
