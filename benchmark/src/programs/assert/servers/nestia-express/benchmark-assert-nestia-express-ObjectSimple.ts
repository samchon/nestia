import core from "@nestia/core";
import { Controller, Post } from "@nestjs/common";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectSimple } from "../../../../structures/pure/ObjectSimple";
import { createNestExpressAssertProgram } from "../createNestExpressAssertProgram";

createNestExpressAssertProgram(false)(37_012)(() => {
  @Controller()
  class NestiaController {
    @Post("assert")
    public assert(@core.TypedBody() _input: Collection<ObjectSimple>): void {}
  }
  return NestiaController;
});
