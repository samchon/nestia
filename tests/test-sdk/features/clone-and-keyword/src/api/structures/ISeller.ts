import type { tags } from "typia";

export namespace ISeller {
  export type IAuthorized = {
    authorization: {
      token: string;
      expires_at: string & tags.Format<"date-time">;
    };

    /**
     * Primary key.
     */
    id: number & tags.Type<"uint32">;

    /**
     * Email address.
     */
    email: string & tags.Format<"email">;

    /**
     * Name of the seller.
     */
    name: string;

    /**
     * Mobile number of the seller.
     */
    mobile: string;

    /**
     * Belonged company name.
     */
    company: string;

    /**
     * Joined time.
     */
    created_at: string & tags.Format<"date-time">;
  };
  export type IJoin = {
    email: string & tags.Format<"email">;
    password: string;
    name: string;
    mobile: string;
    company: string;
  };
  export type ILogin = {
    email: string & tags.Format<"email">;
    password: string;
  };
  export type IChangePassword = {
    old_password: string;
    new_password: string;
  };
}
