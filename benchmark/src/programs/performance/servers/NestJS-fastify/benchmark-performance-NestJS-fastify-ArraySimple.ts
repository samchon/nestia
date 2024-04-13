import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArraySimple } from "../../../../structures/class-validator/ClassValidatorArraySimple";
import { createNestFastifyPerformanceProgram } from "../createNestFastifyPerformanceProgram";

createNestFastifyPerformanceProgram(true)(37_021)(() => {
  @Controller()
  class NestJsController {
    @Post("performance")
    public performance(
      @Body() input: ClassValidatorArraySimple,
    ): ClassValidatorArraySimple {
      return input;
    }
  }
  return NestJsController;
});
