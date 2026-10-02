import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "../api/structures/IBbsArticle";
import IMemo from "../api/structures/IMemo";
import * as pagination from "../api/structures/IPage";

@Controller("bbs/articles")
export class BbsArticleController {
  @core.TypedRoute.Patch()
  public async index(): Promise<pagination.IPage<IBbsArticle>> {
    return typia.random<pagination.IPage<IBbsArticle>>();
  }

  @core.TypedRoute.Get("memo")
  public async memo(): Promise<IMemo> {
    return typia.random<IMemo>();
  }

  @core.TypedRoute.Post()
  public async store(
    @core.TypedBody() input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    return {
      ...typia.random<IBbsArticle>(),
      ...input,
    };
  }
}
