import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectUnionExplicit } from "../../../../structures/pure/ObjectUnionExplicit";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(false)(37_012)(
  (input: Collection<ObjectUnionExplicit>) => {
    @Controller()
    class NestiaController {
      @core.TypedRoute.Get("stringify")
      public stringify(): Collection<ObjectUnionExplicit> {
        return input;
      }
    }
    return NestiaController;
  },
);
