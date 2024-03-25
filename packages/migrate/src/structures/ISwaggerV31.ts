import { OpenAPIV3_1 } from "openapi-types";

export interface ISwaggerV31 extends Omit<OpenAPIV3_1.Document, "openapi"> {
  openapi: `3.1.${number}`;
}
export namespace ISwaggerV31 {
  export interface IVersion {
    openapi: `3.1.${number}`;
  }
}
