import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ArrayHierarchical } from "../../../../structures/pure/ArrayHierarchical";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)((input: ArrayHierarchical[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ArrayHierarchical[] {
            return input;
        }
    }
    return NestiaController;
});