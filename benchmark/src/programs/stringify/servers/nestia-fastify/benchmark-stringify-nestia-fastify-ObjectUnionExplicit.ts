import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ObjectUnionExplicit } from "../../../../structures/pure/ObjectUnionExplicit";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(37_022)((input: ObjectUnionExplicit[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ObjectUnionExplicit[] {
            return input;
        }
    }
    return NestiaController;
});