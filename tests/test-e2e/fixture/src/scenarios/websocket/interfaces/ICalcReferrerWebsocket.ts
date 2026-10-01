import { tags } from "typia";

export interface ICalcReferrerWebsocket {
  referrerUrl: string & tags.Format<"uri">;
}
