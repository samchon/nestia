import { IJsonComponents } from "typia";

import { ISwaggerSecurityScheme } from "./ISwaggerSecurityScheme";

export interface ISwaggerComponents {
    schemas?: Record<string, IJsonComponents.IObject | IJsonComponents.IAlias>;
    securitySchemes?: Record<string, ISwaggerSecurityScheme>;
}
