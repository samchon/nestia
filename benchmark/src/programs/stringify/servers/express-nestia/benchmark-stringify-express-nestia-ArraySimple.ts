import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)((input: ArraySimple[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ArraySimple[] {
            return input;
        }
    }
    return NestiaController;
});