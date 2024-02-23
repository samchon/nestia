import core from "@nestia/core";
import { All, Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("all")
export class AllController {
  /**
   * Store an article.
   *
   * Create an article, and returns it.
   *
   * @param request Request object from express. Must be disappeared in SDK
   * @param input Content to store
   * @returns Newly archived article
   *
   * @author Samchon
   * @warning This is an fake API
   */
  @All()
  public async store(
    @core.TypedBody() input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    const output: IBbsArticle = {
      ...typia.random<IBbsArticle>(),
      ...input,
    };
    return output;
  }
}
