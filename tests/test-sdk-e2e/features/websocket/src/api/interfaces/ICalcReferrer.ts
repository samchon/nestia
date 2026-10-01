import { tags } from "typia";

export interface ICalcReferrer {
  referrerUrl: string & tags.Format<"uri">;
}
