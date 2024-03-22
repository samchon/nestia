import { ISwaggerRouteBodyContent } from "./ISwaggerRouteBodyContent";

export interface ISwaggerRouteResponse {
  description?: string;
  content?: ISwaggerRouteBodyContent;
}
export namespace ISwaggerRouteResponse {
  export interface IReference {
    $ref: `#/components/responses/${string}`;
  }
}
