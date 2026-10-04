import { tags } from "typia";

export interface IPage<T> {
  data: T[];
  pagination: IPage.IPagination;
}
export namespace IPage {
  /** Page request data */
  export interface IRequest {
    page?: (number & tags.Type<"uint32">) | null;

    limit?: (number & tags.Type<"uint32">) | null;
  }

  /** Page information. */
  export interface IPagination {
    current: number & tags.Type<"uint32">;

    limit: number & tags.Type<"uint32">;

    records: number & tags.Type<"uint32">;

    pages: number & tags.Type<"uint32">;
  }
}
