import type { Format } from "typia/lib/tags/Format";
import type { MaxLength } from "typia/lib/tags/MaxLength";
import type { MinLength } from "typia/lib/tags/MinLength";

export type IAttachmentFile = {
  /**
   * @minLength 1
   */
  name: null | (string & MaxLength<255>);
  extension: null | (string & MinLength<1> & MaxLength<8>);
  url: string & Format<"uri">;
};
