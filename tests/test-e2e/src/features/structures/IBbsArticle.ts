import { IPage } from "./IPage";

/**
 * The namespace groups article request and summary records used by validator
 * scenarios.
 */
export namespace IBbsArticle {
  /** Page request info with some options. */
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
     */
    export interface ISearch {
      /** Optional writer text to search for. */
      writer?: string;
      /** Optional title text to search for. */
      title?: string;
    }
    /** List of sortable columns. */
    export type SortableColumns =
      | "writer"
      | "title"
      | "created_at"
      | "updated_at";
  }

  /** Summarized info. */
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
