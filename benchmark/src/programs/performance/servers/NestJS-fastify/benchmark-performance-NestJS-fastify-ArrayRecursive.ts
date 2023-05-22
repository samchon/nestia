import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArrayRecursive } from "../../../../structures/class-validator/ClassValidatorArrayRecursive";
import { createNestFastifyPerformanceProgram } from "../createNestFastifyPerformanceProgram";

createNestFastifyPerformanceProgram(true)(37_021)(
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