import type { tags } from "typia";

/**
 * Attachment file.
 */
export type IAttachmentFile = {
  name: null | (string & tags.MinLength<1> & tags.MaxLength<255>);
  extension: null | (string & tags.MinLength<1> & tags.MaxLength<8>);
  url: string & tags.Format<"uri">;
};
