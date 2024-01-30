import type { Type } from "typia/lib/tags/Type";

export namespace IPage {
  /**
   * Page request data
   */
  export type IRequest =
    /**
     * Page request data
     */
    {
      page?: null | undefined | (number & Type<"uint32">);
      limit?: null | undefined | (number & Type<"uint32">);
    };
  /**
   * Page information.
   */
  export type IPagination =
    /**
     * Page information.
     */
    {
      current: number & Type<"uint32">;
      limit: number & Type<"uint32">;
      records: number & Type<"uint32">;
      pages: number & Type<"uint32">;
    };
}
