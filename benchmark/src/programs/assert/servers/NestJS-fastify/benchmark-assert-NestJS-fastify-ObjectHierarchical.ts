import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectHierarchical } from "../../../../structures/class-validator/ClassValidatorObjectHierarchical";
import { createNestFastifyAssertProgram } from "../createNestFastifyAssertProgram";

createNestFastifyAssertProgram(true)(37_021)(
    () => {
        @Controller()
        class NestJsController {
            @Post("assert")
            public assert(@Body() input: ClassValidatorObjectHierarchical): void {
                input;
            }
        }
        return NestJsController;
    },
);