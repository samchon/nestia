import { IJsonComponents, IJsonSchema } from "typia";
import { IJsDocTagInfo } from "typia/lib/metadata/IJsDocTagInfo";

export interface ISwaggerDocument {
    openapi: "3.0";
    servers: ISwaggerDocument.IServer[];
    info: ISwaggerDocument.IInfo;
    components: ISwaggerDocument.IComponents;
    security?: Record<string, string[]>[];
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
        tags: string[];
        parameters: IParameter[];
        requestBody?: IRequestBody;
        responses: IResponseBody;
        summary?: string;
        description: string;
        "x-nestia-namespace": string;
        "x-nestia-jsDocTags": IJsDocTagInfo[];
    }

    export interface IParameter {
        name: string;
        in: string;
        schema: IJsonSchema;
        required: boolean;
        description: string;
    }
    export interface IRequestBody {
        description: string;
        content: IJsonContent;
        required: true;
        "x-nestia-encrypted": boolean;
    }
    export type IResponseBody = Record<
        string,
        {
            description: string;
            content?: IJsonContent;
            "x-nestia-encrypted"?: boolean;
        }
    >;
    export interface IJsonContent {
        "application/json": {
            schema: IJsonSchema;
        };
    }
}
