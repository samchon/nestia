import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectRecursive } from "../../../../structures/class-validator/ClassValidatorObjectRecursive";
import { createNestExpressPerformanceProgram } from "../createNestExpressPerformanceProgram";

createNestExpressPerformanceProgram(true)(37_011)(
    () => {
        @Controller()
        class NestJsController {
            @Post("performance")
            public performance(
                @Body() input: ClassValidatorObjectRecursive
            ): ClassValidatorObjectRecursive {
                return input;
            }
        }
        return NestJsController;
    },
);