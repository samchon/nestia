import type { tags } from "typia";

export namespace IPage {
  /**
   * Page information.
   */
  export type IPagination = {
    current: number & tags.Type<"uint32">;
    limit: number & tags.Type<"uint32">;
    records: number & tags.Type<"uint32">;
    pages: number & tags.Type<"uint32">;
  };
  /**
   * Page request data
   */
  export type IRequest = {
    page?: null | undefined | (number & tags.Type<"uint32">);
    limit?: null | undefined | (number & tags.Type<"uint32">);
  };
}
