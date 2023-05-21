import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArrayRecursive } from "../../../../structures/class-validator/ClassValidatorArrayRecursive";
import { createNestFastifyAssertProgram } from "../createNestFastifyAssertProgram";

createNestFastifyAssertProgram(true)(37_021)(
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