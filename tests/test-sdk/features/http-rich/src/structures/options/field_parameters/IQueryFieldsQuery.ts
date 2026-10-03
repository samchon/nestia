export interface IQueryFieldsQuery {
  limit?: number;
  enforce: boolean;
  values?: string[];
  atomic: string | null;
}
