import { tags } from "typia";

export namespace IUser {
  export type IProfile = {
    id: string & tags.Format<"uuid">;
    name: string;
    created_at: string & tags.Format<"date-time">;
  };
  export namespace IProfile {
    export type o1 = {
      id: string & tags.Format<"uuid">;
      name: string;
      created_at: string & tags.Format<"date-time">;
    };
  }
}
