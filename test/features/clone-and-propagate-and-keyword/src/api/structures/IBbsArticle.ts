import type { Format } from "typia/lib/tags/Format";
import type { MaxLength } from "typia/lib/tags/MaxLength";
import type { MinLength } from "typia/lib/tags/MinLength";

import type { IAttachmentFile } from "./IAttachmentFile";

/**
 * Article info.
 */
export type IBbsArticle = {
  /**
   * Primary Key.
   */
  id: string & Format<"uuid">;

  /**
   * Belonged section code.
   */
  section: string;

  /**
   * Creation time.
   */
  created_at: string & Format<"date-time">;
  updated_at: string & Format<"date-time">;
  title: string & MinLength<3> & MaxLength<50>;
  body: string;
  files: IAttachmentFile[];
};
export namespace IBbsArticle {
  export type ISummary = {
    id: string & Format<"uuid">;
    section: string;
    writer: string;
    title: string & MinLength<3> & MaxLength<50>;
    created_at: string & Format<"date-time">;
    updated_at: string & Format<"date-time">;
  };
  export type IStore = {
    title: string & MinLength<3> & MaxLength<50>;
    body: string;
    files: IAttachmentFile[];
  };
}
