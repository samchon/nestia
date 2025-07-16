import type { Recordstringstring } from "./Recordstringstring";

export namespace OmitOpenApi {
  export namespace ISecurityScheme {
    export namespace IOAuth2 {
      /**
       * Construct a type with the properties of T except for those in type K.
       */
      export type IFlowtokenUrl = {
        authorizationUrl?: undefined | string;
        refreshUrl?: undefined | string;
        scopes?: undefined | Recordstringstring;
      };
      /**
       * Construct a type with the properties of T except for those in type K.
       */
      export type IFlowauthorizationUrl = {
        tokenUrl?: undefined | string;
        refreshUrl?: undefined | string;
        scopes?: undefined | Recordstringstring;
      };
    }
  }
}
