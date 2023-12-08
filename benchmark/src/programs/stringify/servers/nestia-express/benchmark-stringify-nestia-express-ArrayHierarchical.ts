import { Controller } from "@nestjs/common";

import core from "@Nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ArrayHierarchical } from "../../../../structures/pure/ArrayHierarchical";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(false)(37_012)((input: Collection<ArrayHierarchical>) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): Collection<ArrayHierarchical> {
            return input;
        }
    }
    return NestiaController;
});