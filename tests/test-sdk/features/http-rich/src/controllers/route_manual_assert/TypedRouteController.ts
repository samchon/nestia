import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "../../structures/route_manual_assert/IBbsArticle";

@Controller("http_rich/route_manual_assert/route")
export class RouteManualAssertTypedRouteController {
  @core.TypedRoute.Get("random", {
    type: "assert",
    assert: typia.json.createAssertStringify<IBbsArticle>(),
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
