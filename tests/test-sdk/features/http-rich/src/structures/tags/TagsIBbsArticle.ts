export interface TagsIBbsArticle extends TagsIBbsArticle.IStore {
  /** @format uuid */
  id: string;

  section: string;

  /** @format date-time */
  created_at: string;
}
export namespace TagsIBbsArticle {
  export interface IStore {
    /**
     * @minLength 3
     * @maxLength 50
     */
    title: string;
    body: string;
    files: TagsIAttachmentFile[];
  }
}

export interface TagsIAttachmentFile {
  /**
   * @minLength 1
   * @maxLength 255
   */
  name: string | null;

  /**
   * @minLength 1
   * @maxLength 8
   */
  extension: string | null;

  /** @format uri */
  url: string;
}
