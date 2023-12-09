import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectHierarchical } from "../../../../structures/pure/ObjectHierarchical";
import { createNestFastifyPerformanceProgram } from "../createNestFastifyPerformanceProgram";

createNestFastifyPerformanceProgram(false)(37_022)(() => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Post("performance")
        public performance(
            @core.TypedBody() input: Collection<ObjectHierarchical>
        ): Collection<ObjectHierarchical> {
            return input;
        }
    }
    return NestiaController;
});