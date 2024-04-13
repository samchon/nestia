import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { ArrayRecursive } from "../../../../structures/pure/ArrayRecursive";
import { Collection } from "../../../../structures/pure/Collection";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(false)(37_022)(
  (input: Collection<ArrayRecursive>) => {
    @Controller()
    class NestiaController {
      @core.TypedRoute.Get("stringify")
      public stringify(): Collection<ArrayRecursive> {
        return input;
      }
    }
    return NestiaController;
  },
);
