import type { tags } from "typia";

export type ObjectLietral = {
  id: string;
  member: {
    id: string & tags.Format<"uuid">;
    email: string & tags.Format<"email">;
    age: number & tags.Type<"uint32">;
  };
  created_at: string & tags.Format<"date-time">;
};
