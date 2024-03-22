import { IJsDocTagInfo } from "typia/lib/schemas/metadata/IJsDocTagInfo";

import { ISwaggerRouteParameter } from "./ISwaggerRouteParameter";
import { ISwaggerRouteRequestBody } from "./ISwaggerRouteRequestBody";
import { ISwaggerRouteResponse } from "./ISwaggerRouteResponse";

export interface ISwaggerRoute {
  parameters?: (ISwaggerRouteParameter | ISwaggerRouteParameter.IReference)[];
  requestBody?: ISwaggerRouteRequestBody;
  responses?: Record<
    string,
    ISwaggerRouteResponse | ISwaggerRouteResponse.IReference
  >;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  security?: Record<string, string[]>[];
  tags?: string[];
  "x-nestia-jsDocTags"?: IJsDocTagInfo[];
}
