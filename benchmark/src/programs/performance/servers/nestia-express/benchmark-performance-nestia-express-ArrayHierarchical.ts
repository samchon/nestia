import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { ArrayHierarchical } from "../../../../structures/pure/ArrayHierarchical";
import { Collection } from "../../../../structures/pure/Collection";
import { createNestExpressPerformanceProgram } from "../createNestExpressPerformanceProgram";

createNestExpressPerformanceProgram(false)(37_012)(() => {
  @Controller()
  class NestiaController {
    @core.TypedRoute.Post("performance")
    public performance(
      @core.TypedBody() input: Collection<ArrayHierarchical>,
    ): Collection<ArrayHierarchical> {
      return input;
    }
  }
  return NestiaController;
});
