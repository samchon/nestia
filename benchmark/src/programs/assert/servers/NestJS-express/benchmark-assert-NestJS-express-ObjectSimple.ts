import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectSimple } from "../../../../structures/class-validator/ClassValidatorObjectSimple";
import { createNestExpressAssertProgram } from "../createNestExpressAssertProgram";

createNestExpressAssertProgram(true)(37_011)(() => {
  @Controller()
  class NestJsController {
    @Post("assert")
    public assert(@Body() _input: ClassValidatorObjectSimple): void {}
  }
  return NestJsController;
});
