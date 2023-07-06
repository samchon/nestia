import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArrayHierarchical } from "../../../../structures/class-validator/ClassValidatorArrayHierarchical";
import { createNestFastifyAssertProgram } from "../createNestFastifyAssertProgram";

createNestFastifyAssertProgram(true)(37_021)(
    () => {
        @Controller()
        class NestJsController {
            @Post("assert")
            public assert(@Body() _input: ClassValidatorArrayHierarchical): void {}
        }
        return NestJsController;
    },
);