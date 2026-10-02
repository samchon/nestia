import { IPage } from "./IPage";

/**
 * The namespace groups article request and summary records used by validator
 * scenarios.
 *
 * @evidence contracts/common.md#principled-implementation The namespace groups article request and summary records used by validator scenarios.
 * @evidence contracts/common.md#clear-and-simple-design Nested request search and sortable column members stay with their owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These typed fixture records contain no production dispatch or foreign mutation.
 * @evidence contracts/common.md#meaningful-documentation Request, ordering and summary comments identify the fixture roles.
 */
export namespace IBbsArticle {
  /**
   * Page request info with some options.
   *
   * @evidence contracts/common.md#principled-implementation Extending page requests adds optional ordering and search while retaining optional pagination.
   * @evidence contracts/common.md#clear-and-simple-design Ordering and search remain independent optional properties.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type admits absent filters rather than synthesizing test-specific defaults.
   * @evidence contracts/common.md#meaningful-documentation Comments explain signed order directions and optional search.
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
     * Independent optional writer and title fields permit either filter or
     * both.
     *
     * @evidence contracts/common.md#principled-implementation Independent optional writer and title fields permit either filter or both.
     * @evidence contracts/common.md#clear-and-simple-design A small record exposes the two supported text filters directly.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No runtime behavior or special expected-value computation is embedded in the type.
     * @evidence contracts/common.md#meaningful-documentation Field documentation identifies writer and title substring request filters.
     */
    export interface ISearch {
      /** Optional writer text to search for. */
      writer?: string;
      /** Optional title text to search for. */
      title?: string;
    }
    /**
     * List of sortable columns.
     *
     * @evidence contracts/common.md#principled-implementation The finite string union admits exactly the article fields the fixture endpoint can sort.
     * @evidence contracts/common.md#clear-and-simple-design One alias supplies the request sort generic without parallel lists.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The constants describe real article columns rather than implementation-only test exceptions.
     * @evidence contracts/common.md#meaningful-documentation The declaration comment identifies sortable columns.
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
   * @evidence contracts/common.md#principled-implementation A summary record carries an identifier, writer, title and creation/update instants as strings.
   * @evidence contracts/common.md#clear-and-simple-design The direct record shape makes fields used by comparison tests explicit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts These are ordinary fixture values without patched methods or conditional production behavior.
   * @evidence contracts/common.md#meaningful-documentation Field comments describe article identity, author, text and ISO timestamp roles.
   */
  export interface ISummary {
    /** Article identifier. */
    id: string;
    /** Article author. */
    writer: string;
    /** Article title. */
    title: string;
    /** Creation instant encoded as ISO text. */
    created_at: string;
    /** Last update instant encoded as ISO text. */
    updated_at: string;
  }
}
