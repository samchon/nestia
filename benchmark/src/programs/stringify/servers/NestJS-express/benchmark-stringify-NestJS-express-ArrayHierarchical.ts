import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorArrayHierarchical } from "../../../../structures/class-validator/ClassValidatorArrayHierarchical";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)(
    (input: ClassValidatorArrayHierarchical[]) => {
        @Controller()
        class NestJsController {
            @Get("stringify")
            public stringify(): ClassValidatorArrayHierarchical[] {
                return input.map((i) => 
                    plainToInstance(
                        ClassValidatorArrayHierarchical,
                        i,
                    )
                );
            }
        }
        return NestJsController;
    },
);