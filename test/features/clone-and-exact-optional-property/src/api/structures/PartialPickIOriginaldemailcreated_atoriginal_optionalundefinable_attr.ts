import type { Format } from "typia/lib/tags/Format";

export type PartialPickIOriginaldemailcreated_atoriginal_optionalundefinable_attr = {
    d: string;
    email: null | (string & Format<"email">);
    created_at: null | (string & Format<"date-time">);
    original_optional?: boolean;
    undefinable_attr: undefined | string;
}