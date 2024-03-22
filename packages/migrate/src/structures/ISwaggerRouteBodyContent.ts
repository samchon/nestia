import { ISwaggerSchema } from "./ISwaggerSchema";

export interface ISwaggerRouteBodyContent {
  "text/plain"?: ISwaggerRouteBodyContent.IMediaType;
  "application/json"?: ISwaggerRouteBodyContent.IMediaType;
  "application/x-www-form-urlencoded"?: ISwaggerRouteBodyContent.IMediaType;
  "multipart/form-data"?: ISwaggerRouteBodyContent.IMediaType;
  "*/*"?: ISwaggerRouteBodyContent.IMediaType;
}
export namespace ISwaggerRouteBodyContent {
  export interface IMediaType {
    schema?: ISwaggerSchema;
    "x-nestia-encrypted"?: boolean;
  }
}
