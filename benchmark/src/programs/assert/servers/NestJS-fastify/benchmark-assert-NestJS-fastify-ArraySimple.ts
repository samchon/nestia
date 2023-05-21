import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArraySimple } from "../../../../structures/class-validator/ClassValidatorArraySimple";
import { createNestFastifyAssertProgram } from "../createNestFastifyAssertProgram";

createNestFastifyAssertProgram(true)(37_021)(
    () => {
        @Controller()
        class NestJsController {
            @Post("assert")
            public assert(@Body() input: ClassValidatorArraySimple): void {
                input;
            }
        }
        return NestJsController;
    },
);