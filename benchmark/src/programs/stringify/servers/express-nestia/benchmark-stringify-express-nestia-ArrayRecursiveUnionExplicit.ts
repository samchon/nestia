import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ArrayRecursiveUnionExplicit } from "../../../../structures/pure/ArrayRecursiveUnionExplicit";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)((input: ArrayRecursiveUnionExplicit[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ArrayRecursiveUnionExplicit[] {
            return input;
        }
    }
    return NestiaController;
});