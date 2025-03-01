import type { Format } from "typia/lib/tags/Format";
import type { MaxLength } from "typia/lib/tags/MaxLength";
import type { MinLength } from "typia/lib/tags/MinLength";

export type IAttachmentFile = {
  name: null | (string & MaxLength<255> & MinLength<1>);
  extension: null | (string & MinLength<1> & MaxLength<8>);
  url: string & Format<"uri">;
};
