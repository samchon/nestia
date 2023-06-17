import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ArrayRecursive } from "../../../../structures/pure/ArrayRecursive";
import { createNestExpressAssertProgram } from "../createNestExpressAssertProgram";

createNestExpressAssertProgram(false)(37_012)(() => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Post("assert")
        public assert(@core.TypedBody() input: Collection<ArrayRecursive>): void {
            input;
        }
    }
    return NestiaController;
});