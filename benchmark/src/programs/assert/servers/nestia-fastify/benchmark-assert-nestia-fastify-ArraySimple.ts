import core from "@nestia/core";
import { Controller, Post } from "@nestjs/common";

import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { Collection } from "../../../../structures/pure/Collection";
import { createNestFastifyAssertProgram } from "../createNestFastifyAssertProgram";

createNestFastifyAssertProgram(false)(37_022)(() => {
  @Controller()
  class NestiaController {
    @Post("assert")
    public assert(@core.TypedBody() _input: Collection<ArraySimple>): void {}
  }
  return NestiaController;
});
