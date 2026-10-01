export interface IArticleInput {
  title: string;
  body: string;
}
export interface ISearch {
  page?: number;
  keyword?: string;
}
export interface ITenantHeaders {
  "x-tenant": string;
}
