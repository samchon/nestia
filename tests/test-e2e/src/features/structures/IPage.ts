import { tags } from "typia";

/**
 * Paged record set.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation A page combines an explicit pagination record with typed object records without hiding either shape.
 * @evidence contracts/common.md#clear-and-simple-design Pagination and record data remain separate members for direct test construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The generic limits record elements to objects and adds no runtime adapter.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish record data from one-based pagination.
 */
export interface IPage<T extends object> {
  /** Pagination info. */
  pagination: IPage.IPagination;

  /** List of records */
  data: T[];
}
export namespace IPage {
  /**
   * Pagination info.
   *
   * @evidence contracts/common.md#principled-implementation Page, limit and total counters represent the pagination metadata carried by generated test pages.
   * @evidence contracts/common.md#clear-and-simple-design One nested record groups pagination counters rather than duplicating them beside data.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Default-limit tags annotate the intended shape without computing expected results.
   * @evidence contracts/common.md#meaningful-documentation Comments explain one-based page numbering, limits and totals.
   */
  export interface IPagination {
    /**
     * Current page number.
     *
     * Starts from 1.
     */
    page: number;

    /** Limit records per a page. */
    limit: number & tags.Default<100>;

    /** Number of total records. */
    total_count: number;

    /** Number of total pages. */
    total_pages: number;
  }

  /**
   * Request info of page.
   *
   * @evidence contracts/common.md#principled-implementation Optional page and limit represent absent caller overrides independently of their defaults.
   * @evidence contracts/common.md#clear-and-simple-design One request record separates optional inputs from the required pagination response.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Default-page tags preserve the public fixture semantics without runtime special cases.
   * @evidence contracts/common.md#meaningful-documentation Comments explain the target page and optional limit.
   */
  export interface IRequest {
    /** Target page number. */
    page?: number & tags.Default<1>;

    /**
     * Limit per a page.
     *
     * @default 100
     */
    limit?: number;
  }
  export namespace IRequest {
    /**
     * Template literal members restrict sort terms to a sign and a permitted
     * column name.
     *
     * @evidence contracts/common.md#principled-implementation Template literal members restrict sort terms to a sign and a permitted column name.
     * @evidence contracts/common.md#clear-and-simple-design A single array alias expresses ordered multi-column requests.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Literal signs belong to the fixture request contract rather than test-specific branching.
     * @evidence contracts/common.md#meaningful-documentation The alias documents signed ordering terms for the sortable column parameter.
     */
    export type Sort<Literal extends string> = Array<
      `-${Literal}` | `+${Literal}`
    >;
  }
}
