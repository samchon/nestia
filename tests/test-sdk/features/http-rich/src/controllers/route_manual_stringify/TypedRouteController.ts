import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "../../structures/route_manual_stringify/IBbsArticle";

@Controller("http_rich/route_manual_stringify/route")
export class RouteManualStringifyManualRouteController {
  @core.TypedRoute.Get("random", {
    type: "stringify",
    stringify: typia.json.createStringify<IBbsArticle>(),
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
