import { OpenApi } from "@samchon/openapi";

import { IMigrateRoute } from "./IMigrateRoute";

export interface IMigrateProgram extends IMigrateProgram.IProps {
  routes: IMigrateRoute[];
  errors: IMigrateProgram.IError[];
}
export namespace IMigrateProgram {
  export interface IProps {
    mode: "nest" | "sdk";
    simulate: boolean;
    e2e: boolean;
    document: OpenApi.IDocument;
  }
  export interface IConfig {
    mode: "nest" | "sdk";
    simulate: boolean;
    e2e: boolean;
  }
  export interface IError {
    method: string;
    path: string;
    operation: () => OpenApi.IOperation;
    messages: string[];
  }
}
