import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ObjectUnionExplicit } from "../../../../structures/pure/ObjectUnionExplicit";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)((input: ObjectUnionExplicit[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ObjectUnionExplicit[] {
            return input;
        }
    }
    return NestiaController;
});