import { tags } from "typia";

export interface ISocketCloneCalcReferrer {
  referrerUrl: string & tags.Format<"uri">;
}
