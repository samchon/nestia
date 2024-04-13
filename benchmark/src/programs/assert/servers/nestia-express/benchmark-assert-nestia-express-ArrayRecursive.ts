import core from "@nestia/core";
import { Controller, Post } from "@nestjs/common";

import { ArrayRecursive } from "../../../../structures/pure/ArrayRecursive";
import { Collection } from "../../../../structures/pure/Collection";
import { createNestExpressAssertProgram } from "../createNestExpressAssertProgram";

createNestExpressAssertProgram(false)(37_012)(() => {
  @Controller()
  class NestiaController {
    @Post("assert")
    public assert(@core.TypedBody() _input: Collection<ArrayRecursive>): void {}
  }
  return NestiaController;
});
