import type { Format } from "typia/lib/tags/Format";

export type IAuthentication = {
    user_id: string;
    oauth_type: IAuthentication.OauthType;
}
export namespace IAuthentication {
    export type OauthType = ("google" | "github" | "kakao");
    export type IProfile = {
        id: string;
        name: string;
        email: null | (string & Format<"email">);
        oauth_type: IAuthentication.OauthType;
    }
}