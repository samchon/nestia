import { IJsonSchema } from "typia";

export interface ISwaggerRoute {
  deprecated?: boolean;
  security?: Record<string, string[]>[];
  operationId?: string;
  tags: string[];
  parameters: ISwaggerRoute.IParameter[];
  requestBody?: ISwaggerRoute.IRequestBody;
  responses: ISwaggerRoute.IResponseBody;
  summary?: string;
  description?: string;
}
export namespace ISwaggerRoute {
  export interface IParameter {
    name: string;
    in: string;
    schema: IJsonSchema;
    required: boolean;
    description?: string;
  }
  export interface IRequestBody {
    description?: string;
    content: IContent;
    required: true;
    "x-nestia-encrypted"?: boolean;
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
    "application/x-www-form-urlencoded"?: {
      schema: IJsonSchema;
    };
    "application/json"?: {
      schema: IJsonSchema;
    };
    "text/plain"?: {
      schema: IJsonSchema;
    };
    "multipart/form-data"?: {
      schema: IJsonSchema;
    };
  }
}
