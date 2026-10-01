import { tags } from "typia";

/**
 * Paged record set.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation The generic data array and pagination preserve entity shape and page totals used by validators.
 * @evidence contracts/common.md#clear-and-simple-design The page groups records and their pagination rather than maintaining separate histories.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration represents authored input data and introduces no product behavior or expected-output branch.
 * @evidence contracts/common.md#meaningful-documentation Paged record set with pagination describing its data.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type defines values and selects no processing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no completed or in-flight computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This data representation owns no resource acquisition, retained cache or running task.
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
   * @evidence contracts/common.md#principled-implementation Page, limit, record total and page total represent distinct pagination facts; page numbering starts at one.
   * @evidence contracts/common.md#clear-and-simple-design Four scalar members keep the page position separate from collection totals.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration represents authored input data and introduces no product behavior or expected-output branch.
   * @evidence contracts/common.md#meaningful-documentation Page position and totals for the returned record set.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The type defines values and selects no processing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no completed or in-flight computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This data representation owns no resource acquisition, retained cache or running task.
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
   * @evidence contracts/common.md#principled-implementation Absent settings preserve defaults while supplied numbers represent the caller's requested position and size.
   * @evidence contracts/common.md#clear-and-simple-design One request record groups the two pagination controls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration represents authored input data and introduces no product behavior or expected-output branch.
   * @evidence contracts/common.md#meaningful-documentation Optional page and limit settings for a page request.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The type defines values and selects no processing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no completed or in-flight computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This data representation owns no resource acquisition, retained cache or running task.
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
     * Ordered sort keys whose signs specify ascending or descending direction.
     *
     * @evidence contracts/common.md#principled-implementation The template-literal union permits only a plus or minus prefix on the caller's allowed column names.
     * @evidence contracts/common.md#clear-and-simple-design One generic alias preserves column restrictions and order in an array.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration represents authored input data and introduces no product behavior or expected-output branch.
     * @evidence contracts/common.md#meaningful-documentation Ordered sort keys whose signs specify ascending or descending direction.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The type defines values and selects no processing algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no completed or in-flight computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This data representation owns no resource acquisition, retained cache or running task.
     */
    export type Sort<Literal extends string> = Array<
      `-${Literal}` | `+${Literal}`
    >;
  }
}
