import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "../../structures/route_manual_is/IBbsArticle";

@Controller("http_rich/route_manual_is/route")
export class RouteManualIsTypedRouteController {
  @core.TypedRoute.Get("random", {
    type: "is",
    is: typia.json.createIsStringify<IBbsArticle>(),
  })
  public async random(): Promise<IBbsArticle> {
    return {
      ...typia.random<IBbsArticle>(),
      ...{
        dummy: 1,
      },
    };
  }
}
