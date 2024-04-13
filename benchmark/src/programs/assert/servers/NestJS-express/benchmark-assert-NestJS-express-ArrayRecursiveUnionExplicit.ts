import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArrayRecursiveUnionExplicit } from "../../../../structures/class-validator/ClassValidatorArrayRecursiveUnionExplicit";
import { createNestExpressAssertProgram } from "../createNestExpressAssertProgram";

createNestExpressAssertProgram(true)(37_011)(() => {
  @Controller()
  class NestJsController {
    @Post("assert")
    public assert(
      @Body() _input: ClassValidatorArrayRecursiveUnionExplicit,
    ): void {}
  }
  return NestJsController;
});
