import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectRecursive } from "../../../../structures/class-validator/ClassValidatorObjectRecursive";
import { createNestExpressAssertProgram } from "../createNestExpressAssertProgram";

createNestExpressAssertProgram(true)(37_011)(
    () => {
        @Controller()
        class NestJsController {
            @Post("assert")
            public assert(@Body() _input: ClassValidatorObjectRecursive): void {}
        }
        return NestJsController;
    },
);