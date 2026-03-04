import type { tags } from "typia";

import type { IAttachmentFile } from "./IAttachmentFile";

export type IBbsArticle = {
  id: string & tags.Format<"uuid">;
  title: string & tags.MinLength<3> & tags.MaxLength<50>;
  body: string;
  files: IAttachmentFile[];
  created_at: string & tags.Format<"date-time">;
};
