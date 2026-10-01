import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticleArray } from "../structures/IBbsArticleArray";

@Controller("array/bbs/articles")
export class BbsArticleController {
  @TypedRoute.Get()
  public async index(): Promise<IBbsArticleArray[]> {
    return typia.random<IBbsArticleArray[]>();
  }
}
