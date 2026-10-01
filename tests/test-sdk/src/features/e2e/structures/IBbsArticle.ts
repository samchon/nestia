import { IPage } from "./IPage";

/**
 * Article request and summary shapes used by local validators.
 *
 * @evidence contracts/common.md#principled-implementation Request criteria and summary fields preserve the same article column identities while keeping optional request settings distinct.
 * @evidence contracts/common.md#clear-and-simple-design Related article types share one namespace and reuse the page request representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The namespace groups maintained declarations and adds no expected-output behavior or foreign mutation.
 * @evidence contracts/common.md#meaningful-documentation Article request and summary shapes used by local validators.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace groups declarations; individual functions own their processing algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace coordinates no completed or in-flight computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The namespace owns no retained history, handles or running tasks.
 */
export namespace IBbsArticle {
  /**
   * Page request info with some options.
   *
   * @evidence contracts/common.md#principled-implementation The inherited page controls and optional sort/search settings represent the local validator request contract.
   * @evidence contracts/common.md#clear-and-simple-design Pagination is reused while article-specific criteria stay in this request.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration represents authored input data and introduces no product behavior or expected-output branch.
   * @evidence contracts/common.md#meaningful-documentation Article page request with optional ordered sorting and search fields.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The type defines values and selects no processing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no completed or in-flight computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This data representation owns no resource acquisition, retained cache or running task.
   */
  export interface IRequest extends IPage.IRequest {
    /**
     * Sorting options.
     *
     * The plus sign means ASC and minus sign means DESC.
     */
    sort?: IPage.IRequest.Sort<IRequest.SortableColumns>;

    /** Search options. */
    search?: IRequest.ISearch;
  }
  export namespace IRequest {
    /**
     * Optional writer and title criteria for article search.
     *
     * @evidence contracts/common.md#principled-implementation Absent fields impose no criterion; present strings identify the two supported local search fields.
     * @evidence contracts/common.md#clear-and-simple-design Two optional members keep criteria independent.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration represents authored input data and introduces no product behavior or expected-output branch.
     * @evidence contracts/common.md#meaningful-documentation Optional writer and title criteria for article search.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The type defines values and selects no processing algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no completed or in-flight computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This data representation owns no resource acquisition, retained cache or running task.
     */
    export interface ISearch {
      /** Writer criterion; omission imposes no writer restriction. */
      writer?: string;

      /** Title criterion; omission imposes no title restriction. */
      title?: string;
    }
    /**
     * List of sortable columns.
     *
     * @evidence contracts/common.md#principled-implementation The literal union limits requests to the two textual and two timestamp columns available on summaries.
     * @evidence contracts/common.md#clear-and-simple-design One union names the supported columns without a duplicate runtime list.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration represents authored input data and introduces no product behavior or expected-output branch.
     * @evidence contracts/common.md#meaningful-documentation Article columns accepted by the ordered sort request.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The type defines values and selects no processing algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no completed or in-flight computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This data representation owns no resource acquisition, retained cache or running task.
     */
    export type SortableColumns =
      | "writer"
      | "title"
      | "created_at"
      | "updated_at";
  }

  /**
   * Summarized info.
   *
   * @evidence contracts/common.md#principled-implementation The five strings preserve independently generated identities, textual criteria and ISO timestamp values.
   * @evidence contracts/common.md#clear-and-simple-design One summary record contains the fields consumed by local validator cases.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration represents authored input data and introduces no product behavior or expected-output branch.
   * @evidence contracts/common.md#meaningful-documentation Article identity, text and timestamp fields used by search and sort inputs.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The type defines values and selects no processing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no completed or in-flight computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This data representation owns no resource acquisition, retained cache or running task.
   */
  export interface ISummary {
    /** Generated article identity. */
    id: string;

    /** Writer text available to search and sort operations. */
    writer: string;

    /** Title text available to search and sort operations. */
    title: string;

    /** ISO creation timestamp used by local comparators. */
    created_at: string;

    /** ISO update timestamp used by local comparators. */
    updated_at: string;
  }
}
