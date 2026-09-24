export interface INestedHeaders {
  "x-meta": { tenant: string };
}
export interface IDynamicHeaders {
  [key: string]: string;
}
export type IUnionHeaders = { "x-a": string } | { "x-b": string };
export interface INullableHeaders {
  "x-tenant": string | null;
}
export interface INativeHeaders {
  "x-tags": Set<string>;
}
export interface IMeta {
  tenant: string;
}
