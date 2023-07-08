import { IMigrateRoute } from "./IMigrateRoute";

export interface IMigrateController {
    name: string;
    path: string;
    location: string;
    routes: IMigrateRoute[];
}
