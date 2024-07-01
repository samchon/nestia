import { tags } from "typia/lib";

export interface IQuery {
  limit?: number;
  enforce: boolean;
  values: string[] & tags.MinItems<1>;
  atomic: string | null;
}
