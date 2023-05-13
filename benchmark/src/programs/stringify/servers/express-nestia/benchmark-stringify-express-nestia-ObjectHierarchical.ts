import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ObjectHierarchical } from "../../../../structures/pure/ObjectHierarchical";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)((input: ObjectHierarchical[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ObjectHierarchical[] {
            return input;
        }
    }
    return NestiaController;
});