export type ISwaggerSecurity =
    | ISwaggerSecurity.IHttpBasic
    | ISwaggerSecurity.IHttpBearer
    | ISwaggerSecurity.IApiKey
    | ISwaggerSecurity.IOpenId
    | ISwaggerSecurity.IOAuth2;
export namespace ISwaggerSecurity {
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
        in: "header" | "query" | "cookie";
        name: string;
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
