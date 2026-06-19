export interface IBbsArticle extends IBbsArticle.ICreate {
  /** @format uuid */
  id: string;

  /** @format date-time */
  created_at: string;
}
export namespace IBbsArticle {
  export interface ICreate {
    /**
     * @minLength 3
     * @maxLength 50
     */
    title: string;
    body: string;
    files: IAttachmentFile[];
  }

  export type IUpdate = Partial<ICreate>;
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

  /** @format uri */
  url: string;
}
