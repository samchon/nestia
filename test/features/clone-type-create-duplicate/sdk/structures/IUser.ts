import type { Format } from "typia/lib/tags/Format";

export namespace IUser {
  export type IProfile = {
    id: string & Format<"uuid">;
    name: string;
    created_at: string & Format<"date-time">;
  };
  export namespace IProfile {
    export type o1 = {
      id: string & Format<"uuid">;
      name: string;
      created_at: string & Format<"date-time">;
    };
  }
}
