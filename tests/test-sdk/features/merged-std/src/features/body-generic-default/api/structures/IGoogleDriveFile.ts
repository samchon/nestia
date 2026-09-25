import { tags } from "typia";

export interface IGoogleDriveFile {
  id: string & tags.Format<"uuid">;
  location: string;
  name: string;
  extension: null | string;
  url: string & tags.Format<"uri">;
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
}
