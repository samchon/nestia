import { tags } from "typia";

export interface IBbsArticle {
  id: string & tags.Format<"uuid">;
  title: string & tags.MinLength<3> & tags.MaxLength<50>;
  body: string;
  files: IAttachmentFile[];
  created_at: string & tags.Format<"date-time">;
}

export interface IAttachmentFile {
  name: string & tags.MaxLength<255> & tags.Example<"logo">;
  extension: null | (string & tags.MinLength<1> & tags.MaxLength<8>);
  url: string;
}
