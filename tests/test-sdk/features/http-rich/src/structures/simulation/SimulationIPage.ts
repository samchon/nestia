import { tags } from "typia";

export interface SimulationIPage<T> {
  data: T[];
  pagination: SimulationIPage.IPagination;
}
export namespace SimulationIPage {
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
