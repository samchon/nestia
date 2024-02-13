import { ISwaggerSchema } from "./ISwaggerSchema";
import { ISwaggerSecurityScheme } from "./ISwaggerSecurityScheme";

export interface ISwaggerComponents {
  schemas?: Record<string, ISwaggerSchema>;
  securitySchemes?: Record<string, ISwaggerSecurityScheme>;
}
