import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "../../structures/import_type/IBbsArticle";
import IMemo from "../../structures/import_type/IMemo";
import * as pagination from "../../structures/import_type/IPage";

@Controller("http_rich/import_type/bbs/articles")
export class ImportTypeBbsArticleController {
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
