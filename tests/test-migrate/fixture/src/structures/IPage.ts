import { tags } from "typia";

export interface IPage<T> {
  pagination: IPage.IPagination;
  data: T[];
}

export namespace IPage {
  export interface IPagination {
    current: number & tags.Type<"uint32">;
    limit: number & tags.Type<"uint32">;
    records: number & tags.Type<"uint32">;
    pages: number & tags.Type<"uint32">;
  }

  export interface IRequest {
    page?: number & tags.Type<"uint32"> & tags.Minimum<1>;
    limit?: number & tags.Type<"uint32"> & tags.Minimum<1> & tags.Maximum<100>;
    search?: string & tags.MinLength<2> & tags.MaxLength<80>;
    sort?: "created_at" | "-created_at" | "title" | "-title";
  }
}
