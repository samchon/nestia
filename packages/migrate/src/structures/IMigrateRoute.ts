import { ISwaggerSchema } from "./ISwaggerSchema";

export interface IMigrateRoute {
  name: string;
  originalPath: string;
  path: string;
  method: string;
  accessor: string[];
  parameters: IMigrateRoute.IParameter[];
  headers: IMigrateRoute.IHeaders | null;
  query: IMigrateRoute.IQuery | null;
  body: IMigrateRoute.IBody | null;
  success: IMigrateRoute.IBody | null;
  exceptions: Record<string, IMigrateRoute.IException>;
  comment: () => string;
  tags: string[];
  deprecated: boolean;
}
export namespace IMigrateRoute {
  export interface IParameter {
    name: string;
    key: string;
    schema: ISwaggerSchema;
    description?: string;
  }
  export interface IHeaders {
    name: string;
    key: string;
    schema: ISwaggerSchema;
  }
  export interface IQuery {
    name: string;
    key: string;
    schema: ISwaggerSchema;
  }
  export interface IBody {
    name: string;
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
