export interface IgnoreIBbsArticle extends IgnoreIBbsArticle.IStore {
  /** @format uuid */
  id: string;

  /** @format date-time */
  created_at: string;
}
export namespace IgnoreIBbsArticle {
  export interface IStore {
    /**
     * @minLength 3
     * @maxLength 50
     */
    title: string;
    body: string;
    files: IAttachmentFile[];
  }

  export type IUpdate = Partial<IStore>;
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
