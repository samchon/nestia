import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("route")
export class TypedRouteController {
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

  @core.TypedRoute.Get("is", {
    type: "is",
    is: typia.json.createIsStringify<IBbsArticle>(),
  })
  public async random_is(): Promise<IBbsArticle> {
    return this.random();
  }

  @core.TypedRoute.Get("stringify", {
    type: "stringify",
    stringify: typia.json.createStringify<IBbsArticle>(),
  })
  public async random_stringify(): Promise<IBbsArticle> {
    return this.random();
  }

  @core.TypedRoute.Get("validate", {
    type: "validate",
    validate: typia.json.createValidateStringify<IBbsArticle>(),
  })
  public async random_validate(): Promise<IBbsArticle> {
    return this.random();
  }
}
