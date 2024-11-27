import { IHttpMigrateRoute } from "./IHttpMigrateRoute";

export interface IHttpMigrateController {
  name: string;
  path: string;
  location: string;
  routes: IHttpMigrateRoute[];
}
