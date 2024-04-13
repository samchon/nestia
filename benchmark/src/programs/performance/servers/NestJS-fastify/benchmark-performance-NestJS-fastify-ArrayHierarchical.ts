import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArrayHierarchical } from "../../../../structures/class-validator/ClassValidatorArrayHierarchical";
import { createNestFastifyPerformanceProgram } from "../createNestFastifyPerformanceProgram";

createNestFastifyPerformanceProgram(true)(37_021)(() => {
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
