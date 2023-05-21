import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectSimple } from "../../../../structures/pure/ObjectSimple";
import { createNestFastifyPerformanceProgram } from "../createNestFastifyPerformanceProgram";

createNestFastifyPerformanceProgram(false)(37_022)(() => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Post("performance")
        public performance(
            @core.TypedBody() input: Collection<ObjectSimple>
        ): Collection<ObjectSimple> {
            return input;
        }
    }
    return NestiaController;
});