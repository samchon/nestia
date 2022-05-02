export interface ISwagger
{
    openapi: "3.0";
    info: ISwagger.IInfo;
    paths: Record<string, ISwagger.IPath>;
    components: Record<string, object>;
}
export namespace ISwagger
{
    export type IPath = Record<string, IRoute>;
    export interface IRoute
    {
        description: string;
        tags: string[];
        parameters: IParameter[];
        responses: IResponseBody;
        requestBody?: IRequestBody;
    }

    export interface IInfo
    {
        version: string;
        title: string;
    }
    export interface IParameter
    {
        name: string;
        in: string;
        schema: string;
        required: true;
        description: string;
    }
    export interface IRequestBody
    {
        description: string;
        content: IJsonContent;
        required: true;
    }
    export type IResponseBody = Record<string,
    {
        description: string;
        content?: IJsonContent;
    }>;
    export interface IJsonContent
    {
        "application/json": object;
    }
    
}