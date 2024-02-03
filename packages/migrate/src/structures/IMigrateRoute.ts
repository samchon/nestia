import { ISwaggerSchema } from "./ISwaggeSchema";

export interface IMigrateRoute {
  name: string;
  path: string;
  method: string;
  parameters: IMigrateRoute.IParameter[];
  headers: IMigrateRoute.IHeaders | null;
  query: IMigrateRoute.IQuery | null;
  body: IMigrateRoute.IBody | null;
  success: IMigrateRoute.IBody | null;
  exceptions: Record<string, IMigrateRoute.IException>;
  description?: string;
  tags: string[];
  deprecated: boolean;
}
export namespace IMigrateRoute {
  export interface IParameter {
    key: string;
    schema: ISwaggerSchema;
    description?: string;
  }
  export interface IHeaders {
    key: string;
    schema: ISwaggerSchema;
  }
  export interface IQuery {
    key: string;
    schema: ISwaggerSchema;
  }
  export interface IBody {
    key: string;
    type:
      | "text/plain"
      | "application/json"
      | "application/x-www-form-urlencoded"
      | "multipart/form-data";
    schema: ISwaggerSchema;
    "x-nestia-encrypted"?: boolean;
  }
  export interface IException {
    description?: string;
    schema: ISwaggerSchema;
  }
}
