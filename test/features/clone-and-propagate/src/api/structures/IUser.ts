import type { Format } from "typia/lib/tags/Format";

export type IUser = {
    id: string;
    name: string;
    email: null | (string & Format<"email">);
    optional_attr?: undefined | string;
    undefindable_attr?: undefined | string;
    both_optional_and_undefindable?: undefined | string;
    nullable_attr: null | string;
    optional_and_nullable_attr?: null | undefined | number;
    user_type: IUser.Type;
}
export namespace IUser {
    export type Type = ("default" | "admin" | "seller");
    export type ISearch = {
        user_type?: undefined | IUser.Type;
    }
}