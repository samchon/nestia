import { IAttachmentFile } from "./IAttachmentFile";

export interface IBbsArticle extends IBbsArticle.ICreate {
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
  export interface ISummary {
    /**
     * @format uuid
     */
    id: string;

    /**
     * @minLength 3
     * @maxLength 50
     */
    title: string;

    /**
     * @format date-time
     */
    created_at: string;
  }

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
