import { TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticlesController {
  @TypedRoute.Get(":id")
  public async at(
    @TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<IBbsArticle> {
    return {
      id,
      title: "Hello, world!",
      body: "This is a test article.",
      thumbnail: null,
      created_at: "wrong-data",
    };
  }
}
