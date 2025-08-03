export interface IBbsArticle extends IBbsArticle.IStore {
  /**
   * @format uuid
   */
  id: string;

  /**
   * @format date-time
   */
  created_at: string;
}
export namespace IBbsArticle {
  export interface IStore {
    /**
     * @minLength 3
     * @maxLength 50
     */
    title: string;
    body: string;
    files: IAttachmentFile[];
  }
}

export interface IAttachmentFile {
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

  /**
   * @format uri
   */
  url: string;
}
