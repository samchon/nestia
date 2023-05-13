import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { ObjectHierarchical } from "../../../../structures/pure/ObjectHierarchical";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(37_022)((input: ObjectHierarchical[]) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): ObjectHierarchical[] {
            return input;
        }
    }
    return NestiaController;
});