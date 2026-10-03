export interface ExceptionIBbsArticle extends ExceptionIBbsArticle.IStore {
  /** @format uuid */
  id: string;

  /** @format date-time */
  created_at: string;
}
export namespace ExceptionIBbsArticle {
  export interface IStore {
    /**
     * @minLength 3
     * @maxLength 50
     */
    title: string;
    body: string;
    files: ExceptionIAttachmentFile[];
  }
}

export interface ExceptionIAttachmentFile {
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
