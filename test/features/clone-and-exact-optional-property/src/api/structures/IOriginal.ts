import type { Format } from "typia/lib/tags/Format";

export type IOriginal = {
    a: string;
    b: string;
    c: string;
    d: string;
    email: null | (string & Format<"email">);
    created_at: null | (string & Format<"date-time">);
    original_optional?: undefined | boolean;
    undefinable_attr?: undefined | string;
}
export namespace IOriginal {
    export type IPartialInterface = {
        email?: null | undefined | (string & Format<"email">);
        created_at?: null | undefined | (string & Format<"date-time">);
        original_optional?: undefined | boolean;
        undefinable_attr?: undefined | string;
        c?: undefined | string;
    }
}