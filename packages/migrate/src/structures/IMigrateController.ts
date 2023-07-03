import { IMigrateRoute } from "./IMigrateMethod";

export interface IMigrateController {
    name: string;
    path: string;
    location: string;
    routes: IMigrateRoute[];
}
