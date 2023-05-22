import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArrayRecursive } from "../../../../structures/class-validator/ClassValidatorArrayRecursive";
import { createNestExpressPerformanceProgram } from "../createNestExpressPerformanceProgram";

createNestExpressPerformanceProgram(true)(37_011)(
    () => {
        @Controller()
        class NestJsController {
            @Post("performance")
            public performance(
                @Body() input: ClassValidatorArrayRecursive
            ): ClassValidatorArrayRecursive {
                return input;
            }
        }
        return NestJsController;
    },
);