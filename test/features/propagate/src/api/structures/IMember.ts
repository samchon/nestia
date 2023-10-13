import { tags } from "typia";

export interface IMember {
    id: string & tags.Format<"uuid">;
    email: string & tags.Format<"email">;
    nickname: string;
    created_at: string & tags.Format<"date-time">;
}
export namespace IMember {
    export interface ILogin {
        email: string & tags.Format<"email">;
        password: string;
    }
}
