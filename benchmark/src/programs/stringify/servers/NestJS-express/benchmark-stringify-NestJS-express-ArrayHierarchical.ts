import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorArrayHierarchical } from "../../../../structures/class-validator/ClassValidatorArrayHierarchical";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(true)(37_011)(
    (input: ClassValidatorArrayHierarchical) => {
        @Controller()
        class NestJsController {
            @Get("stringify")
            public stringify(): ClassValidatorArrayHierarchical {
                return plainToInstance(
                    ClassValidatorArrayHierarchical,
                    input,
                );
            }
        }
        return NestJsController;
    },
);