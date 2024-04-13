import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectUnionExplicit } from "../../../../structures/class-validator/ClassValidatorObjectUnionExplicit";
import { createNestFastifyPerformanceProgram } from "../createNestFastifyPerformanceProgram";

createNestFastifyPerformanceProgram(true)(37_021)(() => {
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
