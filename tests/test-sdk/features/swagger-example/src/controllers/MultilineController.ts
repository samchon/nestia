import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "../api/structures/IBbsArticle";

@Controller("multiline")
export class MultilineController {
  /**
   * Read with tags whose text runs over lines.
   *
   * @example
   *   const article = await api.functional.multiline.read(connection);
   *   if (article.title.length !== 0) {
   *     console.log(article.title);
   *   }
   *
   * @throws 404 When nothing is found under the key it was asked for, even
   *   after the fallback was consulted
   * @tag Multiline
   *   Tags whose text runs over lines
   * @security bearer
   *   read write
   * @operationId readMultilineTags
   *   and a note after it
   */
  @core.TypedRoute.Get()
  public read(): IBbsArticle.ICreate {
    return typia.random<IBbsArticle.ICreate>();
  }
}
