export interface IPage<T> {
  data: T[];
  pagination: IPage.IPagination;
}
export namespace IPage {
  export interface IPagination {
    current: number;
    limit: number;
    records: number;
    pages: number;
  }
}
