import type { Format } from "typia/lib/tags/Format";

/**
 * Make all properties in T optional
 */
export type PartialPickIUsernameemailnullable_attroptional_attr = {
    name?: undefined | string;
    email?: null | undefined | (string & Format<"email">);
    nullable_attr?: null | undefined | string;
    optional_attr?: undefined | string;
}