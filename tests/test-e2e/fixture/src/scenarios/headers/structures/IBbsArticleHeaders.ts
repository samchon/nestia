export interface IBbsArticleHeaders extends IBbsArticleHeaders.IStoreHeaders {
  /** @format uuid */
  id: string;

  /** @format date-time */
  created_at: string;
}
export namespace IBbsArticleHeaders {
  export interface IStoreHeaders {
    /**
     * @minLength 3
     * @maxLength 50
     */
    title: string;
    body: string;
    files: IAttachmentFileHeaders[];
  }
}

export interface IAttachmentFileHeaders {
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
