import { ISwaggerRouteParameter } from "./ISwaggerRouteParameter";
import { ISwaggerRouteRequestBody } from "./ISwaggerRouteRequestBody";
import { ISwaggerRouteResponse } from "./ISwaggerRouteResponse";
import { ISwaggerSchema } from "./ISwaggerSchema";
import { ISwaggerSecurityScheme } from "./ISwaggerSecurityScheme";

export interface ISwaggerComponents {
  parameters?: Record<string, ISwaggerRouteParameter>;
  requestBodies?: Record<string, ISwaggerRouteRequestBody>;
  responses?: Record<string, ISwaggerRouteResponse>;
  schemas?: Record<string, ISwaggerSchema>;
  securitySchemes?: Record<string, ISwaggerSecurityScheme>;
  "x-nestia-namespace"?: string;
}
