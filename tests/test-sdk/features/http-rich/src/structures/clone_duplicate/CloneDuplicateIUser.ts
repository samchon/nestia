import typia from "typia";

export interface CloneDuplicateIUser {
  id: string & typia.tags.Format<"uuid">;
  name: string;
  created_at: string & typia.tags.Format<"date-time">;
}

export namespace CloneDuplicateIUser {
  export interface IIdentity {
    user_id: string & typia.tags.Format<"uuid">;
  }

  export interface IProfile extends Pick<
    CloneDuplicateIUser,
    "id" | "name" | "created_at"
  > {}

  export interface ICreate extends Pick<CloneDuplicateIUser, "name"> {
    account_id: string & typia.tags.Format<"uuid">;
  }
}
