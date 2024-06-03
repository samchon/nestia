export interface IBbsArticle<Format extends string = string>
  extends IBbsArticle.IStore<Format> {
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
  export interface IStore<Format extends string = string> {
    /**
     * @minLength 3
     * @maxLength 50
     */
    title: string;
    body: string;
    format: Format;
    files: IAttachmentFile[];
  }

  export type IUpdate<Format extends string = string> = Partial<IStore<Format>>;
}

export interface IAttachmentFile {
  /**
   * @minLengt 1
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
