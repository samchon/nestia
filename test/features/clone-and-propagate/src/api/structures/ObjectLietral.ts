import type { Format } from "typia/lib/tags/Format";

export type ObjectLietral = {
  id: string;
  member: {
    token: string;
    expires_at: string & Format<"date-time">;
  };
  created_at: string & Format<"date-time">;
};
