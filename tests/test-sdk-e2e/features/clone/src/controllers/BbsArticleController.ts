import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";

@Controller("bbs/articles")
export class BbsArticleController {
  @TypedRoute.Get("random")
  public async random(): Promise<IBbsArticle> {
    return typia.random<IBbsArticle>();
  }
}
interface IBbsArticle {
  id: string & tags.Format<"uuid">;
  title: string & tags.MinLength<3> & tags.MaxLength<50>;
  body: string;
  files: IAttachmentFile[];
  created_at: string & tags.Format<"date-time">;
}

interface IAttachmentFile {
  name: string & tags.MaxLength<255> & tags.Example<"logo">;
  extension: null | (string & tags.MinLength<1> & tags.MaxLength<8>);
  url: string;
}
