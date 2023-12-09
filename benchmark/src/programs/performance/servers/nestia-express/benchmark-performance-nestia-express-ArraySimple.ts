import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { createNestExpressPerformanceProgram } from "../createNestExpressPerformanceProgram";

createNestExpressPerformanceProgram(false)(37_012)(() => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Post("performance")
        public performance(
            @core.TypedBody() input: Collection<ArraySimple>
        ): Collection<ArraySimple> {
            return input;
        }
    }
    return NestiaController;
});