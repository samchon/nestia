import { ISwaggerSchema } from "./ISwaggerSchema";
import { ISwaggerSecurity } from "./ISwaggerSecurity";

export interface ISwaggerComponents {
  schemas?: Record<string, ISwaggerSchema>;
  securitySchemes?: Record<string, ISwaggerSecurity>;
}
