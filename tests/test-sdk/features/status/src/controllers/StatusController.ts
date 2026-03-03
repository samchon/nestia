import core from "@nestia/core";
import { Controller, HttpCode } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("status")
export class StatusController {
  @HttpCode(300)
  @core.TypedRoute.Get("random")
  public async random(): Promise<IBbsArticle> {
    return typia.random<IBbsArticle>();
  }
}
