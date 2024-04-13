import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectRecursive } from "../../../../structures/class-validator/ClassValidatorObjectRecursive";
import { createNestFastifyAssertProgram } from "../createNestFastifyAssertProgram";

createNestFastifyAssertProgram(true)(37_021)(() => {
  @Controller()
  class NestJsController {
    @Post("assert")
    public assert(@Body() _input: ClassValidatorObjectRecursive): void {}
  }
  return NestJsController;
});
