import { tags } from "typia";

export interface IExampleQuery {
  keyword: string & tags.MinLength<1>;
  /** @deprecated */
  page?: number & tags.Type<"uint32">;
  size?: number & tags.Type<"uint32">;
}
