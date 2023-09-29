import type { Format } from "typia/lib/tags/Format";

export type PartialPickIUsernameemailnullable_attroptional_attr = {
    name?: undefined | string;
    email?: null | undefined | (string & Format<"email">);
    nullable_attr?: null | undefined | string;
    optional_attr?: undefined | string;
}