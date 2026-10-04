import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";

@Controller("http_rich/options/clone_shapes/base/bbs/articles")
export class CloneShapesBaseBbsArticleController {
  @TypedRoute.Get("random")
  public async random(): Promise<CloneShapesBaseIBbsArticle> {
    return typia.random<CloneShapesBaseIBbsArticle>();
  }
}
interface CloneShapesBaseIBbsArticle {
  id: string & tags.Format<"uuid">;
  title: string & tags.MinLength<3> & tags.MaxLength<50>;
  body: string;
  files: CloneShapesBaseIAttachmentFile[];
  created_at: string & tags.Format<"date-time">;
}

interface CloneShapesBaseIAttachmentFile {
  name: string & tags.MaxLength<255> & tags.Example<"logo">;
  extension: null | (string & tags.MinLength<1> & tags.MaxLength<8>);
  url: string;
}
