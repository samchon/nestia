export interface INestQuery {
  limit?: `${number}`;
  enforce: `${boolean}`;
  atomic: string;
  values: string[];
}
