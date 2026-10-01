import { tags } from "typia";

export interface IBbsArticleRoute {
  id: string & tags.Format<"uuid">;
  title: string & tags.MinLength<3> & tags.MaxLength<50>;
  body: string;
  files: IAttachmentFileRoute[];
  created_at: string & tags.Format<"date-time">;
}

export interface IAttachmentFileRoute {
  name: string & tags.MaxLength<255> & tags.Example<"logo">;
  extension: null | (string & tags.MinLength<1> & tags.MaxLength<8>);
  url: string;
}
