import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ObjectSimple } from "../../../../structures/pure/ObjectSimple";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(37_022)((input: ObjectSimple[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ObjectSimple[] {
            return input;
        }
    }
    return NestiaController;
});