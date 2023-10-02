import type { Format } from "typia/lib/tags/Format";

export type IDateDefined = {
    string: (string & Format<"date-time">);
    date: (string & Format<"date-time">);
}