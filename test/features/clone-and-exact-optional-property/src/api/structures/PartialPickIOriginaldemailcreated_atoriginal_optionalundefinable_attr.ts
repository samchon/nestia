import type { Format } from "typia/lib/tags/Format";

/**
 * Make all properties in T optional
 */
export type PartialPickIOriginaldemailcreated_atoriginal_optionalundefinable_attr = {
    d?: undefined | string;
    email?: null | undefined | (string & Format<"email">);
    created_at?: null | undefined | (string & Format<"date-time">);
    original_optional?: undefined | boolean;
    undefinable_attr?: undefined | string;
}