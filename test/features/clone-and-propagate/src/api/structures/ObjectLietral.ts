import type { Format } from "typia/lib/tags/Format";
import type { Type } from "typia/lib/tags/Type";

export type ObjectLietral = {
  id: string;
  member: {
    id: string & Format<"uuid">;
    email: string & Format<"email">;
    age: number & Type<"uint32">;
  };
  created_at: string & Format<"date-time">;
};
