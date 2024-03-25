import { OpenAPIV2 } from "openapi-types";

export interface ISwaggerV20
  extends Omit<OpenAPIV2.Document, "swagger">,
    ISwaggerV20.IVersion {}
export namespace ISwaggerV20 {
  export interface IVersion {
    swagger: "2.0";
  }
}
