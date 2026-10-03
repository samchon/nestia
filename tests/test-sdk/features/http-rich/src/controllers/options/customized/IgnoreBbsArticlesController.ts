import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";
import { v4 } from "uuid";

import { IgnoreIBbsArticle } from "../../../structures/customized/ignore/IgnoreIBbsArticle";

@Controller("http_rich/options/customized/ignore_bbs/articles")
export class IgnoreBbsArticlesController {
  /**
   * Store an article.
   *
   * @deprecated
   * @param input Content to store
   * @returns Newly archived article
   */
  @TypedRoute.Post()
  public async store(
    @TypedBody() input: IgnoreIBbsArticle.IStore,
  ): Promise<IgnoreIBbsArticle> {
    const output: IgnoreIBbsArticle = {
      ...typia.random<IgnoreIBbsArticle>(),
      ...input,
      id: v4(),
      created_at: new Date().toISOString(),
    };
    return output;
  }

  /** @internal */
  @TypedRoute.Put(":id")
  public async update(
    @TypedParam("id") id: string & tags.Format<"uuid">,
    @TypedBody() input: IgnoreIBbsArticle.IUpdate,
  ): Promise<void> {
    id;
    input;
  }

  /** @ignore */
  @TypedRoute.Put(":id")
  public async erase(
    @TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<void> {
    id;
  }
}
