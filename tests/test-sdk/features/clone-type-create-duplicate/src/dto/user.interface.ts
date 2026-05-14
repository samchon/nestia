import typia from "typia";

export interface IUser {
  id: string & typia.tags.Format<"uuid">;
  name: string;
  created_at: string & typia.tags.Format<"date-time">;
}

export namespace IUser {
  export interface IIdentity {
    user_id: string & typia.tags.Format<"uuid">;
  }

  export interface IProfile extends Pick<IUser, "id" | "name" | "created_at"> {}

  export interface ICreate extends Pick<IUser, "name"> {
    account_id: string & typia.tags.Format<"uuid">;
  }
}
