import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ArrayRecursive } from "../../../../structures/pure/ArrayRecursive";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)((input: ArrayRecursive[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ArrayRecursive[] {
            return input;
        }
    }
    return NestiaController;
});