import { IMigrateController } from "./IMigrateController";
import { IMigrateRoute } from "./IMigrateRoute";
import { ISwagger } from "./ISwagger";
import { ISwaggerRoute } from "./ISwaggerRoute";

export interface IMigrateProgram extends IMigrateProgram.IProps {
  controllers: IMigrateController[];
}
export namespace IMigrateProgram {
  export type Dictionary = Map<ISwaggerRoute, IEntry>;
  export interface IEntry {
    controller: IMigrateController;
    route: IMigrateRoute;
  }
  export interface IProps {
    mode: "nest" | "sdk";
    simulate: boolean;
    swagger: ISwagger;
    dictionary: Dictionary;
  }
  export interface IConfig {
    mode: "nest" | "sdk";
    simulate: boolean;
  }
}
