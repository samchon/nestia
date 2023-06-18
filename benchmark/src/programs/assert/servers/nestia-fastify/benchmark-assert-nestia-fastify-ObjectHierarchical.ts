import { Controller, Post } from "@nestjs/common";

import core from "@nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectHierarchical } from "../../../../structures/pure/ObjectHierarchical";
import { createNestFastifyAssertProgram } from "../createNestFastifyAssertProgram";

createNestFastifyAssertProgram(false)(37_022)(() => {
    @Controller()
    class NestiaController {
        @Post("assert")
        public assert(@core.TypedBody() _input: Collection<ObjectHierarchical>): void {}
    }
    return NestiaController;
});