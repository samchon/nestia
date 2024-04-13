import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectUnionExplicit } from "../../../../structures/class-validator/ClassValidatorObjectUnionExplicit";
import { createNestExpressPerformanceProgram } from "../createNestExpressPerformanceProgram";

createNestExpressPerformanceProgram(true)(37_011)(() => {
  @Controller()
  class NestJsController {
    @Post("performance")
    public performance(
      @Body() input: ClassValidatorObjectUnionExplicit,
    ): ClassValidatorObjectUnionExplicit {
      return input;
    }
  }
  return NestJsController;
});
