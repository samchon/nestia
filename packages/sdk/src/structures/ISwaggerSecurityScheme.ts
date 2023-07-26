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
export type ISwaggerSecurityScheme =
    | ISwaggerSecurityScheme.IHttpBasic
    | ISwaggerSecurityScheme.IHttpBearer
    | ISwaggerSecurityScheme.IApiKey
    | ISwaggerSecurityScheme.IOpenId
    | ISwaggerSecurityScheme.IOAuth2;
export namespace ISwaggerSecurityScheme {
    export interface IHttpBasic {
        type: "http";
        scheme: "basic";
    }
    export interface IHttpBearer {
        type: "http";
        scheme: "bearer";
        bearerFormat?: string;
    }
    export interface IApiKey {
        type: "apiKey";

        /**
         * @default header
         */
        in?: "header" | "query" | "cookie";

        /**
         * @default Authorization
         */
        name?: string;
    }

    export interface IOpenId {
        type: "openIdConnect";
        openIdConnectUrl: string;
    }

    export interface IOAuth2 {
        type: "oauth2";
        flows: IOAuth2.IFlowSet;
        description?: string;
    }
    export namespace IOAuth2 {
        export interface IFlowSet {
            authorizationCode?: IFlow;
            implicit?: Omit<IFlow, "tokenUrl">;
            password?: Omit<IFlow, "authorizationUrl">;
            clientCredentials?: Omit<IFlow, "authorizationUrl">;
        }
        export interface IFlow {
            authorizationUrl: string;
            tokenUrl: string;
            refreshUrl: string;
            scopes?: Record<string, string>;
        }
    }
}
