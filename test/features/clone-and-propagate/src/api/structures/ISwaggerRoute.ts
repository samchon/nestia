import type { __type } from "./__type";
import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IJsonSchema } from "./IJsonSchema";
import type { RecordstringArraystring } from "./RecordstringArraystring";

export type ISwaggerRoute = {
    deprecated?: undefined | boolean;
    security?: undefined | Array<RecordstringArraystring>;
    operationId?: undefined | string;
    tags: Array<string>;
    parameters: Array<ISwaggerRoute.IParameter>;
    requestBody?: undefined | ISwaggerRoute.IRequestBody;
    responses: ISwaggerRoute.IResponseBody;
    summary?: undefined | string;
    description?: undefined | string;
    "x-nestia-method": string;
    "x-nestia-namespace": string;
    "x-nestia-jsDocTags"?: undefined | Array<IJsDocTagInfo>;
}
export namespace ISwaggerRoute {
    export type IResponseBody = {
        [key: string]: __type.o4;
    }
    export type IParameter = {
        name: string;
        "in": string;
        schema: IJsonSchema;
        required: boolean;
        description?: undefined | string;
    }
    export type IRequestBody = {
        description?: undefined | string;
        content: ISwaggerRoute.IContent;
        required: (true);
        "x-nestia-encrypted": boolean;
    }
    export type IContent = {
        "application/x-www-form-urlencoded"?: undefined | __type.o1;
        "application/json"?: undefined | __type.o2;
        "text/plain"?: undefined | __type.o3;
    }
}