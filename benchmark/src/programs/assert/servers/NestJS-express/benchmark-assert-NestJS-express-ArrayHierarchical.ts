import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArrayHierarchical } from "../../../../structures/class-validator/ClassValidatorArrayHierarchical";
import { createNestExpressAssertProgram } from "../createNestExpressAssertProgram";

createNestExpressAssertProgram(true)(37_011)(
    () => {
        @Controller()
        class NestJsController {
            @Post("assert")
            public assert(@Body() _input: ClassValidatorArrayHierarchical): void {}
        }
        return NestJsController;
    },
);