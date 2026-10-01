export interface IBbsArticleBody extends IBbsArticleBody.IStoreBody {
  /** @format uuid */
  id: string;

  /** @format date-time */
  created_at: string;
}
export namespace IBbsArticleBody {
  export interface IStoreBody {
    /**
     * @minLength 3
     * @maxLength 50
     */
    title: string;
    body: string;
    files: IAttachmentFileBody[];
  }

  export type IUpdateBody = Partial<IStoreBody>;
}

export interface IAttachmentFileBody {
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
