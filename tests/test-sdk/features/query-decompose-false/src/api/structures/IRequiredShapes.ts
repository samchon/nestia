export type IUnionQuery = { name: string } | { page?: string };

export interface IIgnoredQuery {
  keyword?: string;
  /** @ignore */
  tenant: string;
}

export interface IFilter {
  section?: string;
}
