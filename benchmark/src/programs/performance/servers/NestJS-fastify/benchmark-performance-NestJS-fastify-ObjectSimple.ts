import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectSimple } from "../../../../structures/class-validator/ClassValidatorObjectSimple";
import { createNestFastifyPerformanceProgram } from "../createNestFastifyPerformanceProgram";

createNestFastifyPerformanceProgram(true)(37_021)(() => {
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
