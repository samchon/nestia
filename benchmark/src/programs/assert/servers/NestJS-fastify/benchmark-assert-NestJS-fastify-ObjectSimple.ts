import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectSimple } from "../../../../structures/class-validator/ClassValidatorObjectSimple";
import { createNestFastifyAssertProgram } from "../createNestFastifyAssertProgram";

createNestFastifyAssertProgram(true)(37_021)(
    () => {
        @Controller()
        class NestJsController {
            @Post("assert")
            public assert(@Body() input: ClassValidatorObjectSimple): void {
                input;
            }
        }
        return NestJsController;
    },
);