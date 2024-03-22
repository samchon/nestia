import { ISwaggerRouteBodyContent } from "./ISwaggerRouteBodyContent";

export interface ISwaggerRouteRequestBody {
  description?: string;
  required?: boolean;
  content?: ISwaggerRouteBodyContent;
}
export namespace ISwaggerRouteRequestBody {
  export interface IReference {
    $ref: `#/components/requestBodies/${string}`;
  }
}
