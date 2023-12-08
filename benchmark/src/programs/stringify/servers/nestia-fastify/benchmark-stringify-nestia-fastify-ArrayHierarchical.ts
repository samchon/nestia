import { Controller } from "@nestjs/common";

import core from "@Nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ArrayHierarchical } from "../../../../structures/pure/ArrayHierarchical";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(false)(37_022)((input: Collection<ArrayHierarchical>) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): Collection<ArrayHierarchical> {
            return input;
        }
    }
    return NestiaController;
});