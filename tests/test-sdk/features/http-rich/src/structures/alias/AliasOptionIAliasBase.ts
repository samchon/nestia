import { tags } from "typia";

export interface AliasOptionIAliasBase {
  id: string & tags.Format<"uuid">;
  created_at: string & tags.Format<"date-time">;
}
