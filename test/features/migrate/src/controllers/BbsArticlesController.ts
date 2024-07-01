import core from "@nestia/core";
import { Controller, Request } from "@nestjs/common";
import typia, { tags } from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IPage } from "@api/lib/structures/IPage";

@Controller("bbs/articles")
export class BbsArticlesController {
  @core.TypedRoute.Patch()
  public async index(
    @core.TypedQuery() query: IPage.IRequest,
  ): Promise<IPage<IBbsArticle.ISummary>> {
    query;
    return typia.random<IPage<IBbsArticle.ISummary>>();
  }

  @core.TypedRoute.Get(":id")
  public async at(
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
  ): Promise<IBbsArticle> {
    return {
      ...typia.random<IBbsArticle>(),
      id,
    };
  }

  /**
   * Store an article.
   *
   * @param request Request object from express. Must be disappeared in SDK
   * @param input Content to store
   * @returns Newly archived article
   *
   * @author Samchon
   * @warning This is an fake API
   */
  @core.TypedRoute.Post()
  public async create(
    @Request() request: any,
    @core.TypedBody() input: IBbsArticle.ICreate,
  ): Promise<IBbsArticle> {
    request;
    const output: IBbsArticle = {
      ...typia.random<IBbsArticle>(),
      ...input,
    };
    return output;
  }

  @core.TypedRoute.Put(":id")
  public async update(
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
    @core.TypedBody() input: IBbsArticle.IUpdate,
  ): Promise<void> {
    id;
    input;
  }
}
