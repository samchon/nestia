import type { OpenApi } from "./OpenApi";

export namespace RecordstringOpenApi {
  export namespace IServer {
    /**
     * Construct a type with a set of properties K of type T
     */
    export type IVariable = {
      [key: string]: OpenApi.IServer.IVariable;
    };
  }
  /**
   * Construct a type with a set of properties K of type T
   */
  export type ISecurityScheme = {
    [key: string]:
      | OpenApi.ISecurityScheme.IApiKey
      | OpenApi.ISecurityScheme.IHttpBasic
      | OpenApi.ISecurityScheme.IHttpBearer
      | OpenApi.ISecurityScheme.IOAuth2
      | OpenApi.ISecurityScheme.IOpenId;
  };
}
