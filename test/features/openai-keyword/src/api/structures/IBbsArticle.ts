import { tags } from "typia";

import { IAttachmentFile } from "./IAttachmentFile";
import { IPage } from "./IPage";

/**
 * Article entity.
 *
 * `IBbsArticle* is a super-type entity of all kinds of articles in the current
 * backend system, literally shaping individual articles of the bulletin board.
 *
 * And, as you can see, the elements that must inevitably exist in the article,
 * such as the `title` or the `body`, do not exist in the `IBbsArticle`, but exist
 * in the subsidiary entity, {@link IBbsArticle.ISnapshot}, as a 1: N relationship,
 * which is because a new snapshot record is published every time the article is
 * modified.
 *
 * The reason why a new snapshot record is published every time the article is
 * modified is to preserve the evidence. Due to the nature of e-community, there
 * is always a threat of dispute among the participants. And it can happen that
 * disputes arise through articles or {@link IBbsArticleComment comments}, and to
 * prevent such things as modifying existing articles to manipulate the situation,
 * the article is designed in this structure.
 *
 * In other words, to keep evidence, and prevent fraud.
 *
 * @template Snapshot Snapshot content type of the article
 * @author Samchon
 */
export interface IBbsArticle {
  /**
   * Primary Key.
   */
  id: string & tags.Format<"uuid">;

  /**
   * Writer of article.
   */
  writer: string;

  /**
   * List of snapshot contents.
   *
   * It is created for the first time when an article is created, and is
   * accumulated every time the article is modified.
   */
  snapshots: IBbsArticle.ISnapshot[] & tags.MinItems<1>;

  /**
   * Creation time of article.
   */
  created_at: string & tags.Format<"date-time">;
}
export namespace IBbsArticle {
  export type Format = "txt" | "md" | "html";

  /**
   * Snapshot of article.
   *
   * `IBbsArticle.ISnapshot` is a snapshot entity that contains the contents of
   * the article, as mentioned in {@link IBbsArticle}, the contents of the article
   * are separated from the article record to keep evidence and prevent fraud.
   */
  export interface ISnapshot extends Omit<IUpdate, "password"> {
    /**
     * Primary Key.
     */
    id: string & tags.Format<"uuid">;

    /**
     * Creation time of snapshot record.
     *
     * In other words, creation time or update time or article.
     */
    created_at: string & tags.Format<"date-time">;
  }

  export interface IRequest extends IPage.IRequest {
    /**
     * Search condition.
     */
    search?: IRequest.ISearch;

    /**
     * Sort condition.
     */
    sort?: IPage.Sort<IRequest.SortableColumns>;
  }
  export namespace IRequest {
    /**
     * 검색 정보.
     */
    export interface ISearch {
      writer?: string;
      title?: string;
      body?: string;
      title_or_body?: string;

      /**
       * @format date-time
       */
      from?: string;

      /**
       * @format date-time
       */
      to?: string;
    }

    /**
     * Sortable columns of {@link IBbsArticle}.
     */
    export type SortableColumns =
      | "writer"
      | "title"
      | "created_at"
      | "updated_at";
  }

  /**
   * Summarized information of the article.
   */
  export interface ISummary {
    /**
     * Primary Key.
     */
    id: string & tags.Format<"uuid">;

    /**
     * Writer of the article.
     */
    writer: string;

    /**
     * Title of the last snapshot.
     */
    title: string;

    /**
     * Creation time of the article.
     */
    created_at: string & tags.Format<"date-time">;

    /**
     * Modification time of the article.
     *
     * In other words, the time when the last snapshot was created.
     */
    updated_at: string & tags.Format<"date-time">;
  }

  /**
   * Abriged information of the article.
   */
  export interface IAbridge extends ISummary, Omit<IUpdate, "password"> {}

  /**
   * Store content type of the article.
   */
  export interface ICreate extends IUpdate {
    writer: string;
  }

  export interface IUpdate {
    /**
     * Format of body.
     *
     * Same meaning with extension like `html`, `md`, `txt`.
     */
    format: Format;

    /**
     * Title of article.
     */
    title: string;

    /**
     * Content body of article.
     */
    body: string;

    /**
     * List of attachment files.
     */
    files: IAttachmentFile.ICreate[];

    /**
     * Password for modification.
     */
    password: string;
  }

  export interface IErase {
    password: string;
  }
}
