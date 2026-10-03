import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "../../structures/array/IBbsArticle";

@Controller("http_rich/array/bbs/articles")
export class ArrayBbsArticleController {
  @TypedRoute.Get()
  public async index(): Promise<IBbsArticle[]> {
    return typia.random<IBbsArticle[]>();
  }
}
