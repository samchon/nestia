import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(37_022)((input: ArraySimple[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ArraySimple[] {
            return input;
        }
    }
    return NestiaController;
});