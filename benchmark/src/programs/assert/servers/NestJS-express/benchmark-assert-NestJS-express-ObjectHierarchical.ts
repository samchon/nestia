import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectHierarchical } from "../../../../structures/class-validator/ClassValidatorObjectHierarchical";
import { createNestExpressAssertProgram } from "../createNestExpressAssertProgram";

createNestExpressAssertProgram(true)(37_011)(() => {
  @Controller()
  class NestJsController {
    @Post("assert")
    public assert(@Body() _input: ClassValidatorObjectHierarchical): void {}
  }
  return NestJsController;
});
