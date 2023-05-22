import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorArraySimple } from "../../../../structures/class-validator/ClassValidatorArraySimple";
import { createNestExpressPerformanceProgram } from "../createNestExpressPerformanceProgram";

createNestExpressPerformanceProgram(true)(37_011)(
    () => {
        @Controller()
        class NestJsController {
            @Post("performance")
            public performance(
                @Body() input: ClassValidatorArraySimple
            ): ClassValidatorArraySimple {
                return input;
            }
        }
        return NestJsController;
    },
);