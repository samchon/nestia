import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ArrayRecursiveUnionExplicit } from "../../../../structures/pure/ArrayRecursiveUnionExplicit";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(37_022)((input: ArrayRecursiveUnionExplicit[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ArrayRecursiveUnionExplicit[] {
            return input;
        }
    }
    return NestiaController;
});