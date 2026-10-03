import { TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

import { ValidateLogArticle } from "../structures/ValidateLogArticle";

@Controller("http_rich/options/validate_log/bbs/articles")
export class ValidateLogArticlesController {
  @TypedRoute.Get(":id")
  public async at(
    @TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<ValidateLogArticle> {
    return {
      id,
      title: "Hello, world!",
      body: "This is a test article.",
      thumbnail: null,
      created_at: "wrong-data",
    };
  }
}
