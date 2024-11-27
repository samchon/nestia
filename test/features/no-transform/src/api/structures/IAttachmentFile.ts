import { tags } from "typia";

export interface IAttachmentFile {
  name: string & tags.MinLength<1> & tags.MaxLength<255>;
  extension: null | (string & tags.MinLength<1> & tags.MaxLength<8>);
  url: null | (string & tags.Format<"uri">);
}
export namespace IAttachmentFile {
  export interface IUpload {
    file: File;
  }
}
