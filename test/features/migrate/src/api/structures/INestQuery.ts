import { tags } from "typia/lib";

export interface INestQuery {
  limit?: `${number}`;
  enforce: `${boolean}`;
  atomic: string;
  values: string[] & tags.MinItems<1>;
}
