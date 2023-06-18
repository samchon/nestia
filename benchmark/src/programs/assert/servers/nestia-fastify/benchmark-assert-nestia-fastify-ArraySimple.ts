import { Controller, Post } from "@nestjs/common";

import core from "@nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { createNestFastifyAssertProgram } from "../createNestFastifyAssertProgram";

createNestFastifyAssertProgram(false)(37_022)(() => {
    @Controller()
    class NestiaController {
        @Post("assert")
        public assert(@core.TypedBody() _input: Collection<ArraySimple>): void {}
    }
    return NestiaController;
});