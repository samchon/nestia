import type { Format } from "typia/lib/tags/Format";

export type IPartialInterface = {
    email?: null | undefined | (string & Format<"email">);
    created_at?: null | undefined | (string & Format<"date-time">);
    original_optional?: undefined | boolean;
    undefinable_attr?: undefined | string;
    a?: undefined | string;
}