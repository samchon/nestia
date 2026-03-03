import type { Format } from "typia/lib/tags/Format";
import type { MaxLength } from "typia/lib/tags/MaxLength";
import type { MinLength } from "typia/lib/tags/MinLength";

import type { IAttachmentFile } from "./IAttachmentFile";

export type IBbsArticle = {
  id: string & Format<"uuid">;
  title: string & MinLength<3> & MaxLength<50>;
  body: string;
  files: IAttachmentFile[];
  created_at: string & Format<"date-time">;
};
