import type { __type } from "./__type";
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
    [key: string]: __type.o4;
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
    "application/x-www-form-urlencoded"?: undefined | __type.o1;
    "application/json"?: undefined | __type.o2;
    "text/plain"?: undefined | __type.o3;
  };
}
