import type { Format } from "typia/lib/tags/Format";

export type __type = {
    token: string;
    expires_at: (string & Format<"date-time">);
}