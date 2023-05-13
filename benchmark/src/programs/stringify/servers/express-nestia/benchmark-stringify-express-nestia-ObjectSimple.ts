import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ObjectSimple } from "../../../../structures/pure/ObjectSimple";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)((input: ObjectSimple[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ObjectSimple[] {
            return input;
        }
    }
    return NestiaController;
});
