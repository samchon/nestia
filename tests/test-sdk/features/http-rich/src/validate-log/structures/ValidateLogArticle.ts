import { tags } from "typia";

export interface ValidateLogArticle {
  id: string & tags.Format<"uuid">;
  title: string;
  body: string;
  thumbnail:
    | null
    | (string & tags.Format<"uri"> & tags.ContentMediaType<"image/*">);
  created_at: string & tags.Format<"date-time">;
}
