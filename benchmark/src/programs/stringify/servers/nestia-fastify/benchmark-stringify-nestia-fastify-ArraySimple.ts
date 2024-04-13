import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { Collection } from "../../../../structures/pure/Collection";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(false)(37_022)(
  (input: Collection<ArraySimple>) => {
    @Controller()
    class NestiaController {
      @core.TypedRoute.Get("stringify")
      public stringify(): Collection<ArraySimple> {
        return input;
      }
    }
    return NestiaController;
  },
);
