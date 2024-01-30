import type { Format } from "typia/lib/tags/Format";
import type { Type } from "typia/lib/tags/Type";

import type { IJsonSchema } from "./IJsonSchema";
import type { ISwaggerRoute } from "./ISwaggerRoute";

export type __type = {
  id: string & Format<"uuid">;
  email: string & Format<"email">;
  age: number & Type<"uint32">;
};
export namespace __type {
  export type o1 = {
    id: string;
    member: __type.o2;
    created_at: string & Format<"date-time">;
  };
  export type o2 = {
    id: string & Format<"uuid">;
    email: string & Format<"email">;
    age: number & Type<"uint32">;
  };
  export type o3 = {
    token: string;
    expires_at: string & Format<"date-time">;
  };
  export type o4 = {
    schema: IJsonSchema;
  };
  export type o5 = {
    schema: IJsonSchema;
  };
  export type o6 = {
    schema: IJsonSchema;
  };
  export type o7 = {
    description: string;
    content?: undefined | ISwaggerRoute.IContent;
    "x-nestia-encrypted"?: undefined | boolean;
  };
}
