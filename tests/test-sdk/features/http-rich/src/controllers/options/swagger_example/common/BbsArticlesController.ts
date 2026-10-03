import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";
import { v4 } from "uuid";

import { SwaggerExampleIBbsArticle } from "../../../../structures/swagger_example/IBbsArticle";

@Controller("http_rich/options/swagger_example/bbs/articles")
export class SwaggerExampleBbsArticlesController {
  /**
   * Create an article.
   *
   * @author Samchon
   * @param request Request object from express. Must be disappeared in SDK
   * @param input Content to store
   * @returns Newly archived article
   * @warning This is an fake API
   */
  @core.SwaggerExample.Response(typia.random<SwaggerExampleIBbsArticle>())
  @core.TypedRoute.Post()
  public async create(
    @core.SwaggerExample.Parameter(
      typia.random<SwaggerExampleIBbsArticle.ICreate>(),
    )
    @core.SwaggerExample.Parameter(
      "x",
      typia.random<SwaggerExampleIBbsArticle.ICreate>(),
    )
    @core.SwaggerExample.Parameter(
      "y",
      typia.random<SwaggerExampleIBbsArticle.ICreate>(),
    )
    @core.SwaggerExample.Parameter(
      "z",
      typia.random<SwaggerExampleIBbsArticle.ICreate>(),
    )
    @core.TypedBody()
    input: SwaggerExampleIBbsArticle.ICreate,
  ): Promise<SwaggerExampleIBbsArticle> {
    const output: SwaggerExampleIBbsArticle = {
      ...typia.random<SwaggerExampleIBbsArticle>(),
      ...input,
    };
    return output;
  }

  @core.SwaggerExample.Response(typia.random<SwaggerExampleIBbsArticle>())
  @core.SwaggerExample.Response("a", typia.random<SwaggerExampleIBbsArticle>())
  @core.SwaggerExample.Response("b", typia.random<SwaggerExampleIBbsArticle>())
  @core.TypedRoute.Put(":id")
  public async update(
    @core.SwaggerExample.Parameter(v4())
    @core.SwaggerExample.Parameter("n", v4())
    @core.TypedParam("id")
    id: string & tags.Format<"uuid">,
    @core.SwaggerExample.Parameter(
      typia.random<SwaggerExampleIBbsArticle.IUpdate>(),
    )
    @core.TypedBody()
    input: SwaggerExampleIBbsArticle.IUpdate,
  ): Promise<SwaggerExampleIBbsArticle> {
    return {
      ...typia.random<SwaggerExampleIBbsArticle>(),
      ...input,
      id,
    };
  }
}
