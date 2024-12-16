import { tags } from "typia";

export namespace IBbsArticle {
  export interface IUpdate {
    title: string;
    content: string;
    notes: Record<string, string>;
  }
}
