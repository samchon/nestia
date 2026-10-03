import { tags } from "typia";

export interface ISocketCalcReferrer {
  referrerUrl: string & tags.Format<"uri">;
}
