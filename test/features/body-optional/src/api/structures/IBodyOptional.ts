import { tags } from "typia";

export interface IBodyOptional {
  id: string & tags.Format<"uuid">;
  value: number;
}
