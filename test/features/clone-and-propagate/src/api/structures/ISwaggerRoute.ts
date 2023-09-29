import type { __type } from "./__type";
import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IJsonSchema } from "./IJsonSchema";
import type { RecordstringArraystring } from "./RecordstringArraystring";

export type ISwaggerRoute = {
    deprecated?: boolean;
    security?: Array<RecordstringArraystring>;
    operationId?: string;
    tags: Array<string>;
    parameters: Array<ISwaggerRoute.IParameter>;
    requestBody?: ISwaggerRoute.IRequestBody;
    responses: ISwaggerRoute.IResponseBody;
    summary?: string;
    description?: string;
    "x-nestia-method": string;
    "x-nestia-namespace": string;
    "x-nestia-jsDocTags"?: Array<IJsDocTagInfo>;
}
export namespace ISwaggerRoute {
    export type IResponseBody = {
        [key: string]: __type.o3;
    }
    export type IParameter = {
        name: string;
        "in": string;
        schema: IJsonSchema;
        required: boolean;
        description?: string;
    }
    export type IRequestBody = {
        description?: string;
        content: ISwaggerRoute.IContent;
        required: (true);
        "x-nestia-encrypted": boolean;
    }
    export type IContent = {
        "application/json"?: __type.o1;
        "text/plain"?: __type.o2;
    }
}