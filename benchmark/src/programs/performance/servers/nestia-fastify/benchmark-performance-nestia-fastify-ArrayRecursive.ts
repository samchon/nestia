import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ArrayRecursive } from "../../../../structures/pure/ArrayRecursive";
import { createNestFastifyPerformanceProgram } from "../createNestFastifyPerformanceProgram";

createNestFastifyPerformanceProgram(false)(37_022)(() => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Post("performance")
        public performance(
            @core.TypedBody() input: Collection<ArrayRecursive>
        ): Collection<ArrayRecursive> {
            return input;
        }
    }
    return NestiaController;
});