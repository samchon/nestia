import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ArrayHierarchical } from "../../../../structures/pure/ArrayHierarchical";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(37_022)((input: ArrayHierarchical[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ArrayHierarchical[] {
            return input;
        }
    }
    return NestiaController;
});