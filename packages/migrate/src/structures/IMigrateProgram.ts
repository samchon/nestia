import { OpenApi } from "@samchon/openapi";

import { IMigrateController } from "./IMigrateController";
import { IMigrateRoute } from "./IMigrateRoute";

export interface IMigrateProgram extends IMigrateProgram.IProps {
  controllers: IMigrateController[];
}
export namespace IMigrateProgram {
  export type Dictionary = Map<OpenApi.IOperation, IEntry>;
  export interface IEntry {
    controller: IMigrateController;
    route: IMigrateRoute;
  }
  export interface IProps {
    mode: "nest" | "sdk";
    simulate: boolean;
    e2e: boolean;
    document: OpenApi.IDocument;
    dictionary: Dictionary;
  }
  export interface IConfig {
    mode: "nest" | "sdk";
    simulate: boolean;
    e2e: boolean;
  }
}
