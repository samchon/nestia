import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArrayRecursiveUnionExplicit } from "../../../../structures/class-validator/ClassValidatorArrayRecursiveUnionExplicit";
import { createNestExpressPerformanceProgram } from "../createNestExpressPerformanceProgram";

createNestExpressPerformanceProgram(true)(37_011)(() => {
  @Controller()
  class NestJsController {
    @Post("performance")
    public performance(
      @Body() input: ClassValidatorArrayRecursiveUnionExplicit,
    ): ClassValidatorArrayRecursiveUnionExplicit {
      return input;
    }
  }
  return NestJsController;
});
