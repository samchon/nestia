import { tags } from "typia";

export namespace IBbsArticle {
  export interface IUpdate {
    title: string;
    content: string;
    thumbnail?: string & tags.Format<"uri">;
  }
}
