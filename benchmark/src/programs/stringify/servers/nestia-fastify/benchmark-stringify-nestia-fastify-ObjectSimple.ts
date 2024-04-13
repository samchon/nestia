import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectSimple } from "../../../../structures/pure/ObjectSimple";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(false)(37_022)(
  (input: Collection<ObjectSimple>) => {
    @Controller()
    class NestiaController {
      @core.TypedRoute.Get("stringify")
      public stringify(): Collection<ObjectSimple> {
        return input;
      }
    }
    return NestiaController;
  },
);
