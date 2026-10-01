import { tags } from "typia";

export interface IBbsArticleArray {
  id: string & tags.Format<"uuid">;
  title: string & tags.MinLength<3> & tags.MaxLength<50>;
  body: string;
  files: IAttachmentFileArray[];
  created_at: string & tags.Format<"date-time">;
}

export interface IAttachmentFileArray {
  name: string & tags.MaxLength<255> & tags.Example<"logo">;
  extension: null | (string & tags.MinLength<1> & tags.MaxLength<8>);
  url: string;
}
