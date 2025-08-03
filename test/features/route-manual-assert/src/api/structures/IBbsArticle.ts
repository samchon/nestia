export interface IBbsArticle {
  /** @format uuid */
  id: string;

  /**
   * @minLength 3
   * @maxLength 50
   */
  title: string;

  body: string;

  files: IAttachmentFile[];

  /** @format date-time */
  created_at: string;
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
