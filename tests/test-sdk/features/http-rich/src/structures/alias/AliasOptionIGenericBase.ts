import { tags } from "typia";

export interface AliasOptionIGenericBase<_Metadata> {
  id: string & tags.Format<"uuid">;
  created_at: string & tags.Format<"date-time">;
}
