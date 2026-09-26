import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticleController {
  @TypedRoute.Get()
  public async index(): Promise<IBbsArticle[]> {
    return typia.random<IBbsArticle[]>();
  }
}
