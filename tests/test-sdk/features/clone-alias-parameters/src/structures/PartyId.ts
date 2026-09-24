import { tags } from "typia";

export type PartyId = string & tags.Format<"uuid">;
