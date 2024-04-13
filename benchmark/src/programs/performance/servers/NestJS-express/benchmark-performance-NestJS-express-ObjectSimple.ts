import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectSimple } from "../../../../structures/class-validator/ClassValidatorObjectSimple";
import { createNestExpressPerformanceProgram } from "../createNestExpressPerformanceProgram";

createNestExpressPerformanceProgram(true)(37_011)(() => {
  @Controller()
  class NestJsController {
    @Post("performance")
    public performance(
      @Body() input: ClassValidatorObjectSimple,
    ): ClassValidatorObjectSimple {
      return input;
    }
  }
  return NestJsController;
});
