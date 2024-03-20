import type { Recordstringstring } from "./Recordstringstring";

export namespace OmitISwaggerSecurityScheme {
  export namespace IOAuth2 {
    /**
     * Construct a type with the properties of T except for those in type K.
     */
    export type IFlowtokenUrl =
      /**
       * Construct a type with the properties of T except for those in type K.
       */
      {
        authorizationUrl: string;
        refreshUrl?: undefined | string;
        scopes?: undefined | Recordstringstring;
      };
    /**
     * Construct a type with the properties of T except for those in type K.
     */
    export type IFlowauthorizationUrl =
      /**
       * Construct a type with the properties of T except for those in type K.
       */
      {
        tokenUrl?: undefined | string;
        refreshUrl?: undefined | string;
        scopes?: undefined | Recordstringstring;
      };
  }
}
