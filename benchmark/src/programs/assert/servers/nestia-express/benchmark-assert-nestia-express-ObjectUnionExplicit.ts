import { Controller, Post } from "@nestjs/common";

import core from "@nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectUnionExplicit } from "../../../../structures/pure/ObjectUnionExplicit";
import { createNestExpressAssertProgram } from "../createNestExpressAssertProgram";

createNestExpressAssertProgram(false)(37_012)(() => {
    @Controller()
    class NestiaController {
        @Post("assert")
        public assert(@core.TypedBody() _input: Collection<ObjectUnionExplicit>): void {}
    }
    return NestiaController;
});