import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";
import { v4 } from "uuid";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticlesController {
  /**
   * Create an article.
   *
   * @author Samchon
   * @param request Request object from express. Must be disappeared in SDK
   * @param input Content to store
   * @returns Newly archived article
   * @warning This is an fake API
   */
  @core.SwaggerExample.Response(typia.random<IBbsArticle>())
  @core.TypedRoute.Post()
  public async create(
    @core.SwaggerExample.Parameter(typia.random<IBbsArticle.ICreate>())
    @core.SwaggerExample.Parameter("x", typia.random<IBbsArticle.ICreate>())
    @core.SwaggerExample.Parameter("y", typia.random<IBbsArticle.ICreate>())
    @core.SwaggerExample.Parameter("z", typia.random<IBbsArticle.ICreate>())
    @core.TypedBody()
    input: IBbsArticle.ICreate,
  ): Promise<IBbsArticle> {
    const output: IBbsArticle = {
      ...typia.random<IBbsArticle>(),
      ...input,
    };
    return output;
  }

  @core.SwaggerExample.Response(typia.random<IBbsArticle>())
  @core.SwaggerExample.Response("a", typia.random<IBbsArticle>())
  @core.SwaggerExample.Response("b", typia.random<IBbsArticle>())
  @core.TypedRoute.Put(":id")
  public async update(
    @core.SwaggerExample.Parameter(v4())
    @core.TypedParam("id")
    id: string & tags.Format<"uuid">,
    @core.SwaggerExample.Parameter(typia.random<IBbsArticle.IUpdate>())
    @core.TypedBody()
    input: IBbsArticle.IUpdate,
  ): Promise<IBbsArticle> {
    return {
      ...typia.random<IBbsArticle>(),
      ...input,
      id,
    };
  }
}
