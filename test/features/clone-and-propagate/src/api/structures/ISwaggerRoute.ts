import type { IJsDocTagInfo } from "./IJsDocTagInfo";
import type { IJsonSchema } from "./IJsonSchema";
import type { RecordstringArraystring } from "./RecordstringArraystring";

export type ISwaggerRoute = {
  deprecated?: undefined | boolean;
  security?: undefined | RecordstringArraystring[];
  operationId?: undefined | string;
  tags: string[];
  parameters: ISwaggerRoute.IParameter[];
  requestBody?: undefined | ISwaggerRoute.IRequestBody;
  responses: ISwaggerRoute.IResponseBody;
  summary?: undefined | string;
  description?: undefined | string;
  "x-nestia-method"?: undefined | string;
  "x-nestia-namespace"?: undefined | string;
  "x-nestia-jsDocTags"?: undefined | IJsDocTagInfo[];
};
export namespace ISwaggerRoute {
  export type IResponseBody = {
    [key: string]: {
      description: string;
      content?: undefined | ISwaggerRoute.IContent;
      "x-nestia-encrypted"?: undefined | boolean;
    };
  };
  export type IParameter = {
    name: string;
    in: string;
    schema: IJsonSchema;
    required: boolean;
    description?: undefined | string;
  };
  export type IRequestBody = {
    description?: undefined | string;
    content: ISwaggerRoute.IContent;
    required: true;
    "x-nestia-encrypted"?: undefined | boolean;
  };
  export type IContent = {
    "application/x-www-form-urlencoded"?:
      | undefined
      | {
          schema: IJsonSchema;
        };
    "application/json"?:
      | undefined
      | {
          schema: IJsonSchema;
        };
    "text/plain"?:
      | undefined
      | {
          schema: IJsonSchema;
        };
  };
}
