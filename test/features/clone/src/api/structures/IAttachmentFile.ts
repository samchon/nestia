import type { Example } from "typia/lib/tags/Example";
import type { MaxLength } from "typia/lib/tags/MaxLength";
import type { MinLength } from "typia/lib/tags/MinLength";

export type IAttachmentFile = {
  name: string & MaxLength<255> & Example<"logo">;
  extension: null | (string & MinLength<1> & MaxLength<8>);
  url: string;
};
