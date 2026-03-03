import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "../api/structures/IBbsArticle";

@Controller("method")
export class MethodController {
  @core.TypedRoute.Get("body")
  public body(@core.TypedBody() input: IBbsArticle.IStore): IBbsArticle {
    input;
    return typia.random<IBbsArticle>();
  }
}
