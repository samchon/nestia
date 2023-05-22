import { Body, Controller, Post } from "@nestjs/common";

import { ClassValidatorObjectHierarchical } from "../../../../structures/class-validator/ClassValidatorObjectHierarchical";
import { createNestExpressPerformanceProgram } from "../createNestExpressPerformanceProgram";

createNestExpressPerformanceProgram(true)(37_011)(
    () => {
        @Controller()
        class NestJsController {
            @Post("performance")
            public performance(
                @Body() input: ClassValidatorObjectHierarchical
            ): ClassValidatorObjectHierarchical {
                return input;
            }
        }
        return NestJsController;
    },
);