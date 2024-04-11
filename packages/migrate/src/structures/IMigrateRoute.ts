import { OpenApi } from "@samchon/openapi";

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
    schema: OpenApi.IJsonSchema;
    description?: string;
  }
  export interface IHeaders {
    name: string;
    key: string;
    schema: OpenApi.IJsonSchema;
  }
  export interface IQuery {
    name: string;
    key: string;
    schema: OpenApi.IJsonSchema;
  }
  export interface IBody {
    name: string;
    key: string;
    type:
      | "text/plain"
      | "application/json"
      | "application/x-www-form-urlencoded"
      | "multipart/form-data";
    schema: OpenApi.IJsonSchema;
    "x-nestia-encrypted"?: boolean;
  }
  export interface IException {
    description?: string;
    schema: OpenApi.IJsonSchema;
  }
}
