import { tags } from "typia";

export interface IBbsArticle {
  id: string;
  title: string;
  body: string;
  thumbnail?: string & tags.Format<"uri">;
}
