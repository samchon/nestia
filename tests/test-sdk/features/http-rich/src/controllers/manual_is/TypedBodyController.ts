import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";
import { v4 } from "uuid";

import { IBbsArticle } from "../../structures/manual_is/IBbsArticle";

@Controller("body_rich/manual_is/body")
export class ManualIsTypedBodyController {
  @core.TypedRoute.Post()
  public async store(
    @core.TypedBody({
      type: "is",
      is: typia.createIs<IBbsArticle.IStore>(),
    })
    input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    return {
      ...input,
      id: v4(),
      created_at: new Date().toISOString(),
    };
  }
}
