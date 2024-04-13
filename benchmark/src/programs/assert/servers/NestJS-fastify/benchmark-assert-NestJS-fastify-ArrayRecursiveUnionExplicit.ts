import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArrayRecursiveUnionExplicit } from "../../../../structures/class-validator/ClassValidatorArrayRecursiveUnionExplicit";
import { createNestFastifyAssertProgram } from "../createNestFastifyAssertProgram";

createNestFastifyAssertProgram(true)(37_021)(() => {
  @Controller()
  class NestJsController {
    @Post("assert")
    public assert(
      @Body() _input: ClassValidatorArrayRecursiveUnionExplicit,
    ): void {}
  }
  return NestJsController;
});
