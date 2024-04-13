import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectRecursive } from "../../../../structures/class-validator/ClassValidatorObjectRecursive";
import { createNestFastifyPerformanceProgram } from "../createNestFastifyPerformanceProgram";

createNestFastifyPerformanceProgram(true)(37_021)(() => {
  @Controller()
  class NestJsController {
    @Post("performance")
    public performance(
      @Body() input: ClassValidatorObjectRecursive,
    ): ClassValidatorObjectRecursive {
      return input;
    }
  }
  return NestJsController;
});
