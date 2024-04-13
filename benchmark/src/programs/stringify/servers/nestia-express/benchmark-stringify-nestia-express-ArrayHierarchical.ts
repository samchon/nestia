import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { ArrayHierarchical } from "../../../../structures/pure/ArrayHierarchical";
import { Collection } from "../../../../structures/pure/Collection";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(false)(37_012)(
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
