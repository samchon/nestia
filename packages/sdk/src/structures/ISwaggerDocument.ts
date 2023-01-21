import { IJsonComponents, IJsonSchema } from "typia";

export interface ISwaggerDocument {
    openapi: "3.0";
    servers: ISwaggerDocument.IServer[];
    info: ISwaggerDocument.IInfo;
    components: ISwaggerDocument.IComponents;
    security?: string[];
    paths: Record<string, ISwaggerDocument.IPath>;
}
export namespace ISwaggerDocument {
    export interface IServer {
        url: string;
        description?: string;
    }

    export interface IInfo {
        version: string;
        title: string;
    }

    export interface IComponents extends IJsonComponents {
        securitySchemes?: Record<string, ISecurityScheme>;
    }

    /* ---------------------------------------------------------
        SECURITY SCHEMES
    --------------------------------------------------------- */
    export type ISecurityScheme =
        | ISecurityScheme.IHttpBasic
        | ISecurityScheme.IHttpBearer
        | ISecurityScheme.IApiKey
        | ISecurityScheme.IOpenId
        | ISecurityScheme.IOAuth2;
    export namespace ISecurityScheme {
        export interface IHttpBasic {
            type: "http";
            schema: "basic";
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

    /* ---------------------------------------------------------
        ROUTE FUNCTIONS
    --------------------------------------------------------- */
    export type IPath = Record<string, IRoute>;
    export interface IRoute {
        description: string;
        tags: string[];
        parameters: IParameter[];
        responses: IResponseBody;
        requestBody?: IRequestBody;
        summary?: string;
        security?: string[];
    }

    export interface IParameter {
        name: string;
        in: string;
        schema: IJsonSchema;
        required: true;
        description: string;
    }
    export interface IRequestBody {
        description: string;
        content: IJsonContent;
        required: true;
    }
    export type IResponseBody = Record<
        string,
        {
            description: string;
            content?: IJsonContent;
        }
    >;
    export interface IJsonContent {
        "application/json": {
            schema: IJsonSchema;
        };
    }
}
