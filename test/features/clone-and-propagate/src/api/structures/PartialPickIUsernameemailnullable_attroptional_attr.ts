import type { Format } from "typia/lib/tags/Format";

export type PartialPickIUsernameemailnullable_attroptional_attr = {
    name: string;
    email: null | (string & Format<"email">);
    nullable_attr: null | string;
    optional_attr?: string;
}