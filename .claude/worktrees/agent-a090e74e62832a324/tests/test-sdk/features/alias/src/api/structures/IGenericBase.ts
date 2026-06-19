import { tags } from "typia";

export interface IGenericBase<Metadata> {
  id: string & tags.Format<"uuid">;
  created_at: string & tags.Format<"date-time">;
}
