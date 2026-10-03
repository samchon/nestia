import core from "@nestia/core";
import { Controller, HttpCode } from "@nestjs/common";
import typia from "typia";

import { StatusIBbsArticle } from "../../structures/status/StatusIBbsArticle";

@Controller("http_rich/status/status")
export class StatusStatusController {
  @HttpCode(300)
  @core.TypedRoute.Get("random")
  public async random(): Promise<StatusIBbsArticle> {
    return typia.random<StatusIBbsArticle>();
  }
}
