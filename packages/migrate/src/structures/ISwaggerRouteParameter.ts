import { ISwaggerSchema } from "./ISwaggerSchema";

export interface ISwaggerRouteParameter {
  name?: string;
  in: "path" | "query" | "header" | "cookie";
  schema: ISwaggerSchema;
  required?: boolean;
  description?: string;
}
export namespace ISwaggerRouteParameter {
  export interface IReference {
    $ref: `#/components/parameters/${string}`;
  }
}
