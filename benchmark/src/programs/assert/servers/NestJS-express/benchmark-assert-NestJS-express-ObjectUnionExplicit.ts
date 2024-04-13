import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectUnionExplicit } from "../../../../structures/class-validator/ClassValidatorObjectUnionExplicit";
import { createNestExpressAssertProgram } from "../createNestExpressAssertProgram";

createNestExpressAssertProgram(true)(37_011)(() => {
  @Controller()
  class NestJsController {
    @Post("assert")
    public assert(@Body() _input: ClassValidatorObjectUnionExplicit): void {}
  }
  return NestJsController;
});
