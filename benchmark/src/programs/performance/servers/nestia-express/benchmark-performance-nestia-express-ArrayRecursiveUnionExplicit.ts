import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { ArrayRecursiveUnionExplicit } from "../../../../structures/pure/ArrayRecursiveUnionExplicit";
import { Collection } from "../../../../structures/pure/Collection";
import { createNestExpressPerformanceProgram } from "../createNestExpressPerformanceProgram";

createNestExpressPerformanceProgram(false)(37_012)(() => {
  @Controller()
  class NestiaController {
    @core.TypedRoute.Post("performance")
    public performance(
      @core.TypedBody() input: Collection<ArrayRecursiveUnionExplicit>,
    ): Collection<ArrayRecursiveUnionExplicit> {
      return input;
    }
  }
  return NestiaController;
});
