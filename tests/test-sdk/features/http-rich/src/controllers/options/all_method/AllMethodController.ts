import core from "@nestia/core";
import { All, Controller } from "@nestjs/common";
import typia from "typia";

import { IAllMethodArticle } from "../../../structures/options/all_method/IAllMethodArticle";

@Controller("http_rich/options/all_method/all")
export class AllMethodController {
  /**
   * Store an article.
   *
   * Create an article, and returns it.
   *
   * @author Samchon
   * @param request Request object from express. Must be disappeared in SDK
   * @param input Content to store
   * @returns Newly archived article
   * @warning This is an fake API
   */
  @All()
  public async store(
    @core.TypedBody() input: IAllMethodArticle.IStore,
  ): Promise<IAllMethodArticle> {
    const output: IAllMethodArticle = {
      ...typia.random<IAllMethodArticle>(),
      ...input,
    };
    return output;
  }
}
