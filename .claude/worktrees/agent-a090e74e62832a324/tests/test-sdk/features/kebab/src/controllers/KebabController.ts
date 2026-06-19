import core from "@nestia/core";
import { Controller, Request } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("ke-bab-with-dashes")
export class KebabController {
  /**
   * Store an article.
   *
   * @author Samchon
   * @param request Request object from express. Must be disappeared in SDK
   * @param input Content to store
   * @returns Newly archived article
   * @warning This is an fake API
   */
  @core.TypedRoute.Post()
  public async store(
    @Request() request: any,
    @core.TypedBody() input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    request;
    const output: IBbsArticle = {
      ...typia.random<IBbsArticle>(),
      ...input,
    };
    return output;
  }
}
