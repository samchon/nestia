import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "../../structures/route_human/IBbsArticle";

@Controller("http_rich/route_human/route")
export class RouteHumanTypedRouteController {
  @core.TypedRoute.Get("random")
  public async random(): Promise<IBbsArticle> {
    return {
      ...typia.random<IBbsArticle>(),
      ...{
        dummy: 1,
      },
    };
  }
}
