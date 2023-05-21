import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArrayRecursive } from "../../../../structures/class-validator/ClassValidatorArrayRecursive";
import { createNestExpressAssertProgram } from "../createNestExpressAssertProgram";

createNestExpressAssertProgram(true)(37_011)(
    () => {
        @Controller()
        class NestJsController {
            @Post("assert")
            public assert(@Body() input: ClassValidatorArrayRecursive): void {
                input;
            }
        }
        return NestJsController;
    },
);