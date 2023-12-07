import type { Format } from "typia/lib/tags/Format";

import type { IJsonSchema } from "./IJsonSchema";
import type { ISwaggerRoute } from "./ISwaggerRoute";

export type __type = {
    token: string;
    expires_at: (string & Format<"date-time">);
}
export namespace __type {
    export type o1 = {
        schema: IJsonSchema;
    }
    export type o2 = {
        schema: IJsonSchema;
    }
    export type o3 = {
        schema: IJsonSchema;
    }
    export type o4 = {
        description: string;
        content?: undefined | ISwaggerRoute.IContent;
        "x-nestia-encrypted"?: undefined | boolean;
    }
}