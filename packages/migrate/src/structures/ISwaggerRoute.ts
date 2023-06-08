import { ISwaggerSchema } from "./ISwaggeSchema";

export interface ISwaggerRoute {
    parameters: ISwaggerRoute.IParameter[];
    requestBody?: ISwaggerRoute.IRequestBody;
    responses: ISwaggerRoute.IResponseBody;
    summary?: string;
    description?: string;
    tags: string[];
}
export namespace ISwaggerRoute {
    export interface IParameter {
        name: string;
        in: string;
        schema: ISwaggerSchema;
        required: boolean;
        description: string;
    }
    export interface IRequestBody {
        description: string;
        content: IContent;
        required: true;
        "x-nestia-encrypted": boolean;
    }
    export type IResponseBody = Record<
        string,
        {
            description: string;
            content?: IContent;
            "x-nestia-encrypted"?: boolean;
        }
    >;
    export interface IContent {
        "application/json": {
            schema: ISwaggerSchema;
        };
    }
}