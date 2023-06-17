import { Controller } from "@nestjs/common";

import core from "@nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectSimple } from "../../../../structures/pure/ObjectSimple";
import { createNestExpressAssertProgram } from "../createNestExpressAssertProgram";

createNestExpressAssertProgram(false)(37_012)(() => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Post("assert")
        public assert(@core.TypedBody() input: Collection<ObjectSimple>): void {
            input;
        }
    }
    return NestiaController;
});