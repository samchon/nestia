import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "../../structures/duplicated/IBbsArticle";

@Controller([
  "http_rich/duplicated/duplicated",
  "http_rich/duplicated/multiple",
])
export class DuplicatedDuplicatedController {
  @core.TypedRoute.Get("at")
  public async at(): Promise<IBbsArticle> {
    return article;
  }
}

const article: IBbsArticle = typia.random<IBbsArticle>();
