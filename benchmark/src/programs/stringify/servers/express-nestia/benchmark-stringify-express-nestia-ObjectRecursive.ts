import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ObjectRecursive } from "../../../../structures/pure/ObjectRecursive";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)((input: ObjectRecursive[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ObjectRecursive[] {
            return input;
        }
    }
    return NestiaController;
});