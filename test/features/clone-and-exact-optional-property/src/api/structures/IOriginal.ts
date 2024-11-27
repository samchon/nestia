import type { Format } from "typia/lib/tags/Format";

import type { ISomething } from "./ISomething";

export type IOriginal = {
  a: string;
  b: string;
  c: string;
  d: string;
  email: null | (string & Format<"email">);
  created_at: null | (string & Format<"date-time">);
  original_optional?: undefined | boolean;
  undefinable_attr?: undefined | string;
  something?: null | undefined | ISomething;
};
export namespace IOriginal {
  export type IPartialInterface = {
    c?: undefined | string;
    email?: null | undefined | (string & Format<"email">);
    created_at?: null | undefined | (string & Format<"date-time">);
    original_optional?: undefined | boolean;
    undefinable_attr?: undefined | string;
  };
}
