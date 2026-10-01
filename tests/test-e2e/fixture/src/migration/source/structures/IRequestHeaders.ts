import { tags } from "typia";

export interface IRequestHeaders {
  authorization: string;
  "x-request-id"?: string & tags.Format<"uuid">;
  "x-feature-flags"?: string[];
}
