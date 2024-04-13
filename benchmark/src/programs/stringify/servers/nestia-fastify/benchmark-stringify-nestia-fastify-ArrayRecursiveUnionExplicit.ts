import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { ArrayRecursiveUnionExplicit } from "../../../../structures/pure/ArrayRecursiveUnionExplicit";
import { Collection } from "../../../../structures/pure/Collection";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(false)(37_022)(
  (input: Collection<ArrayRecursiveUnionExplicit>) => {
    @Controller()
    class NestiaController {
      @core.TypedRoute.Get("stringify")
      public stringify(): Collection<ArrayRecursiveUnionExplicit> {
        return input;
      }
    }
    return NestiaController;
  },
);
