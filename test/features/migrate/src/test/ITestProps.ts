import { IMigrateRoute } from "@samchon/openapi";

import api from "@api";

export interface ITestProps {
  route: (method: string, path: string) => IMigrateRoute;
  connection: api.IConnection;
}
