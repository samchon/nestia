import type { Format } from "typia/lib/tags/Format";
import type { Type } from "typia/lib/tags/Type";

export namespace ISeller {
  export type IAuthorized = {
    authorization: {
      token: string;
      expires_at: string & Format<"date-time">;
    };

    /** Primary key. */
    id: number & Type<"uint32">;

    /** Email address. */
    email: string & Format<"email">;

    /** Name of the seller. */
    name: string;

    /** Mobile number of the seller. */
    mobile: string;

    /** Belonged company name. */
    company: string;

    /** Joined time. */
    created_at: string & Format<"date-time">;
  };
  export type IJoin = {
    email: string & Format<"email">;
    password: string;
    name: string;
    mobile: string;
    company: string;
  };
  export type ILogin = {
    email: string & Format<"email">;
    password: string;
  };
  export type IChangePassword = {
    old_password: string;
    new_password: string;
  };
}
