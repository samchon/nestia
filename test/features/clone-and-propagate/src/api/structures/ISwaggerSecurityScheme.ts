import type { OmitISwaggerSecurityScheme } from "./OmitISwaggerSecurityScheme";
import type { Recordstringstring } from "./Recordstringstring";

/**
 * Security scheme of Swagger Documents.
 * 
 * `ISwaggerSecurityScheme` is a data structure representing content of
 * `securitySchemes` in `swagger.json` file. It is composed with 5 types of security
 * schemes as an union type like below.
 * 
 * @reference https://swagger.io/specification/#security-scheme-object
 * @author Jeongho Nam - https://github.com/samchon
 */
export type ISwaggerSecurityScheme = ISwaggerSecurityScheme.IHttpBasic | ISwaggerSecurityScheme.IHttpBearer | ISwaggerSecurityScheme.IApiKey | ISwaggerSecurityScheme.IOpenId | ISwaggerSecurityScheme.IOAuth2;
export namespace ISwaggerSecurityScheme {
    export type IHttpBasic = {
        type: ("http");
        scheme: ("basic");
    }
    export type IHttpBearer = {
        type: ("http");
        scheme: ("bearer");
        bearerFormat?: undefined | string;
    }
    export type IApiKey = {
        type: ("apiKey");
        /**
         * @default header
         */
        "in"?: undefined | ("header" | "query" | "cookie");
        /**
         * @default Authorization
         */
        name?: undefined | string;
    }
    export type IOpenId = {
        type: ("openIdConnect");
        openIdConnectUrl: string;
    }
    export type IOAuth2 = {
        type: ("oauth2");
        flows: ISwaggerSecurityScheme.IOAuth2.IFlowSet;
        description?: undefined | string;
    }
    export namespace IOAuth2 {
        export type IFlowSet = {
            authorizationCode?: undefined | ISwaggerSecurityScheme.IOAuth2.IFlow;
            implicit?: undefined | OmitISwaggerSecurityScheme.IOAuth2.IFlowtokenUrl;
            password?: undefined | OmitISwaggerSecurityScheme.IOAuth2.IFlowauthorizationUrl;
            clientCredentials?: undefined | OmitISwaggerSecurityScheme.IOAuth2.IFlowauthorizationUrl;
        }
        export type IFlow = {
            authorizationUrl: string;
            tokenUrl: string;
            refreshUrl: string;
            scopes?: undefined | Recordstringstring;
        }
    }
}