import type { Format } from "typia/lib/tags/Format";

export type IAuthentication = {
  user_id: string;
  oauth_type: "google" | "github" | "kakao";
};
export namespace IAuthentication {
  export type IProfile = {
    id: string;
    name: string;
    email: null | (string & Format<"email">);
    oauth_type: "google" | "github" | "kakao";
  };
}
