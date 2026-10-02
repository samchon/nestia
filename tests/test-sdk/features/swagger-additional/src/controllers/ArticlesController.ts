import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("bbs/articles")
export class ArticlesController {
  /**
   * Read an article.
   *
   * @deprecated
   * @tag article
   */
  @core.TypedRoute.Get(":id")
  public at(@core.TypedParam("id") id: string): string {
    return id;
  }
}
