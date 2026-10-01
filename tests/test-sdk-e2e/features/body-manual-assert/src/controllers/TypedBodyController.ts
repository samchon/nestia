import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";
import { v4 } from "uuid";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("body")
export class TypedBodyController {
  @core.TypedRoute.Post()
  public async store(
    @core.TypedBody({
      type: "assert",
      assert: typia.createAssert<IBbsArticle.IStore>(),
    })
    input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    return {
      ...input,
      id: v4(),
      created_at: new Date().toISOString(),
    };
  }

  @core.TypedRoute.Post("is")
  public async store_is(
    @core.TypedBody({
      type: "is",
      is: typia.createIs<IBbsArticle.IStore>(),
    })
    input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    return this.store(input);
  }

  @core.TypedRoute.Post("validate")
  public async store_validate(
    @core.TypedBody({
      type: "validate",
      validate: typia.createValidate<IBbsArticle.IStore>(),
    })
    input: IBbsArticle.IStore,
  ): Promise<IBbsArticle> {
    return this.store(input);
  }
}
