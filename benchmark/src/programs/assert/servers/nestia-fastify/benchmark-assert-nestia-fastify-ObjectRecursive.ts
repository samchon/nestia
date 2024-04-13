import core from "@nestia/core";
import { Controller, Post } from "@nestjs/common";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectRecursive } from "../../../../structures/pure/ObjectRecursive";
import { createNestFastifyAssertProgram } from "../createNestFastifyAssertProgram";

createNestFastifyAssertProgram(false)(37_022)(() => {
  @Controller()
  class NestiaController {
    @Post("assert")
    public assert(
      @core.TypedBody() _input: Collection<ObjectRecursive>,
    ): void {}
  }
  return NestiaController;
});
