export interface INestedQuery {
  filter: { section: string };
}
export interface IDynamicQuery {
  [key: string]: string;
}
export type IUnionQuery = { name: string } | { page: string };
export interface INativeQuery {
  tags: Set<string>;
  when?: Date;
}
export interface IFilter {
  section: string;
}
