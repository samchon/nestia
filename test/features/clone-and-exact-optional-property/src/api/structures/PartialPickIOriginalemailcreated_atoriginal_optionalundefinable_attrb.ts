import type { Format } from "typia/lib/tags/Format";

/**
 * Make all properties in T optional
 */
export type PartialPickIOriginalemailcreated_atoriginal_optionalundefinable_attrb = {
    email?: null | undefined | (string & Format<"email">);
    created_at?: null | undefined | (string & Format<"date-time">);
    original_optional?: undefined | boolean;
    undefinable_attr?: undefined | string;
    b?: undefined | string;
}