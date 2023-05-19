import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorObjectHierarchical } from "../../../../structures/class-validator/ClassValidatorObjectHierarchical";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)(
    (input: ClassValidatorObjectHierarchical[]) => {
        @Controller()
        class NestJsController {
            @Get("stringify")
            public stringify(): ClassValidatorObjectHierarchical[] {
                return input.map((i) => 
                    plainToInstance(
                        ClassValidatorObjectHierarchical,
                        i,
                    )
                );
            }
        }
        return NestJsController;
    },
);