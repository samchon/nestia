export interface IQueryQuery {
  limit?: number;
  enforce: boolean;
  values?: string[];
  atomic: string | null;
}
