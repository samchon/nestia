import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "../../structures/route_manual_validate/IBbsArticle";

@Controller("http_rich/route_manual_validate/route")
export class RouteManualValidateManualRouteController {
  @core.TypedRoute.Get("random", {
    type: "validate",
    validate: typia.json.createValidateStringify<IBbsArticle>(),
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
