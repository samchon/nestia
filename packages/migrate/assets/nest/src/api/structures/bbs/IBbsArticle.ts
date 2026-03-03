import { tags } from "typia";

import { IAttachmentFile } from "../common/IAttachmentFile";
import { IPage } from "../common/IPage";

/**
 * BBS article.
 */
export interface IBbsArticle {
  /**
   * Primary Key.
   */
  id: string & tags.Format<"uuid">;

  /**
   * Section code.
   */
  section: string;

  /**
   * Name of nickname of writer.
   */
  writer: string;

  /**
   * List of snapshot contents.
   *
   * Whenever updating an article, its contents would be accumulated.
   */
  snapshots: IBbsArticle.ISnapshot[];

  /**
   * Creation time of the article.
   */
  created_at: string & tags.Format<"date-time">;
}

export namespace IBbsArticle {
  /**
   * Page request info with some options.
   */
  export interface IRequest extends IPage.IRequest {
    /**
     * Searching options.
     */
    search?: IRequest.ISearch;

    /**
     * Sorting options.
     *
     * The plus sign means ASC and minus sign means DESC.
     */
    sort?: IPage.Sort<IRequest.SortableColumns>;
  }
  export namespace IRequest {
    /**
     * Searching options.
     */
    export interface ISearch {
      writer?: string;
      title?: string;
      body?: string;
    }

    /**
     * List of sortable columns.
     */
    export type SortableColumns =
      | "writer"
      | "title"
      | "created_at"
      | "updated_at";
  }

  /**
   * Summarized info.
   */
  export interface ISummary {
    id: string;
    writer: string;
    title: string;
    created_at: string;
    updated_at: string;
  }

  /**
   * Content info.
   */
  export interface ISnapshot extends Omit<IUpdate, "password"> {
    /**
     * Primary key of individual content.
     */
    id: string & tags.Format<"uuid">;

    /**
     * Creation time of this content.
     */
    created_at: string & tags.Format<"date-time">;
  }

  /**
   * Store info.
   */
  export interface ICreate extends IUpdate {
    /**
     * Name or nickname of the writer.
     */
    writer: string;
  }

  /**
   * Update info.
   */
  export interface IUpdate {
    /**
     * Title of the article.
     */
    title: string;

    /**
     * Content body.
     */
    body: string;

    /**
     * Format of the content body.
     */
    format: "md" | "html" | "txt";

    /**
     * List of files (to be) attached.
     */
    files: IAttachmentFile[];

    /**
     * Password of the article.
     */
    password: string;
  }

  /**
   * Erase info.
   */
  export interface IErase {
    /**
     * Password of the article.
     */
    password: string;
  }
}
