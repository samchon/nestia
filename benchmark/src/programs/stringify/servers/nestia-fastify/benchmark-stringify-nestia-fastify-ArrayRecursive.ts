import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ArrayRecursive } from "../../../../structures/pure/ArrayRecursive";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(37_022)((input: ArrayRecursive[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ArrayRecursive[] {
            return input;
        }
    }
    return NestiaController;
});