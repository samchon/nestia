export interface INestQueryQuery {
  limit?: `${number}`;
  enforce: `${boolean}`;
  atomic: string;
  values: string[];
}
