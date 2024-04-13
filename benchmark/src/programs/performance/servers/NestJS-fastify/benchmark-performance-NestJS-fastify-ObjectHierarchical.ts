import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectHierarchical } from "../../../../structures/class-validator/ClassValidatorObjectHierarchical";
import { createNestFastifyPerformanceProgram } from "../createNestFastifyPerformanceProgram";

createNestFastifyPerformanceProgram(true)(37_021)(() => {
  @Controller()
  class NestJsController {
    @Post("performance")
    public performance(
      @Body() input: ClassValidatorObjectHierarchical,
    ): ClassValidatorObjectHierarchical {
      return input;
    }
  }
  return NestJsController;
});
