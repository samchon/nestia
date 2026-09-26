import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";
import { v4 } from "uuid";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticlesController {
  /**
   * Store an article.
   *
   * @deprecated
   * @param input Content to store
   * @returns Newly archived article
   */
  @TypedRoute.Post()
  public async store(
    @TypedBody() input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    const output: IBbsArticle = {
      ...typia.random<IBbsArticle>(),
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
    @TypedBody() input: IBbsArticle.IUpdate,
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
