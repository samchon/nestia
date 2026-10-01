import { tags } from "typia";

export type SdkBoundaryPartyId = string & tags.Format<"uuid">;
