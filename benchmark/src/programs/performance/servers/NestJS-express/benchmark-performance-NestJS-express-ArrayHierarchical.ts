import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArrayHierarchical } from "../../../../structures/class-validator/ClassValidatorArrayHierarchical";
import { createNestExpressPerformanceProgram } from "../createNestExpressPerformanceProgram";

createNestExpressPerformanceProgram(true)(37_011)(() => {
  @Controller()
  class NestJsController {
    @Post("performance")
    public performance(
      @Body() input: ClassValidatorArrayHierarchical,
    ): ClassValidatorArrayHierarchical {
      return input;
    }
  }
  return NestJsController;
});
