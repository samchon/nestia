import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { ArrayHierarchical } from "../../../../structures/pure/ArrayHierarchical";
import { Collection } from "../../../../structures/pure/Collection";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(false)(37_022)(
  (input: Collection<ArrayHierarchical>) => {
    @Controller()
    class NestiaController {
      @core.TypedRoute.Get("stringify")
      public stringify(): Collection<ArrayHierarchical> {
        return input;
      }
    }
    return NestiaController;
  },
);
