import { IJsonComponents } from "typescript-json/lib/structures/IJsonComponents";
import { IJsonSchema } from "typescript-json/lib/structures/IJsonSchema";

export interface ISwagger {
    openapi: "3.0";
    servers: ISwagger.IServer[];
    info: ISwagger.IInfo;
    paths: Record<string, ISwagger.IPath>;
    components: IJsonComponents;
}
export namespace ISwagger {
    export type IPath = Record<string, IRoute>;
    export interface IRoute {
        description: string;
        tags: string[];
        parameters: IParameter[];
        responses: IResponseBody;
        requestBody?: IRequestBody;
        summary?: string;
    }

    export interface IInfo {
        version: string;
        title: string;
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

    export interface IServer {
        url: string;
        description?: string;
    }

    export interface IJsonContent {
        "application/json": {
            schema: IJsonSchema;
        };
    }
}
