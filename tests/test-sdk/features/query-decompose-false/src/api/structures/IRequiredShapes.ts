export type IUnionQuery = { name: string } | { page?: string };

export interface IInternalQuery {
  keyword?: string;
  /** @internal */
  tenant: string;
}

export interface IFilter {
  section?: string;
}
