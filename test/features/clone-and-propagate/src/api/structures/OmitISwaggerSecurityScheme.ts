import type { Recordstringstring } from "./Recordstringstring";

export namespace OmitISwaggerSecurityScheme {
    export namespace IOAuth2 {
        /**
         * Construct a type with the properties of T except for those in type K.
         */
        export type IFlowtokenUrl = {
            authorizationUrl: string;
            refreshUrl: string;
            scopes?: undefined | Recordstringstring;
        }
        /**
         * Construct a type with the properties of T except for those in type K.
         */
        export type IFlowauthorizationUrl = {
            tokenUrl: string;
            refreshUrl: string;
            scopes?: undefined | Recordstringstring;
        }
    }
}