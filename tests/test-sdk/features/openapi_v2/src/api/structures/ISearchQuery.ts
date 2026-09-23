import { tags } from "typia";

export interface ISearchQuery {
  keyword: string & tags.MinLength<1>;
  /** @deprecated */
  page?: number & tags.Type<"uint32">;
}
