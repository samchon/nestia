import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArrayRecursiveUnionExplicit } from "../../../../structures/class-validator/ClassValidatorArrayRecursiveUnionExplicit";
import { createNestFastifyPerformanceProgram } from "../createNestFastifyPerformanceProgram";

createNestFastifyPerformanceProgram(true)(37_021)(() => {
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
