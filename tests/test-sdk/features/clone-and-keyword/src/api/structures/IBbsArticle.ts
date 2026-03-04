import type { tags } from "typia";

import type { IAttachmentFile } from "./IAttachmentFile";

/**
 * Article info.
 */
export type IBbsArticle = {
  id: string & tags.Format<"uuid">;
  section: string;
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
  title: string & tags.MinLength<3> & tags.MaxLength<50>;
  body: string;
  files: IAttachmentFile[];
};
export namespace IBbsArticle {
  export type ISummary = {
    id: string & tags.Format<"uuid">;
    section: string;
    writer: string;
    title: string & tags.MinLength<3> & tags.MaxLength<50>;
    created_at: string & tags.Format<"date-time">;
    updated_at: string & tags.Format<"date-time">;
  };
  export type IStore = {
    title: string & tags.MinLength<3> & tags.MaxLength<50>;
    body: string;
    files: IAttachmentFile[];
  };
}
