import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorArrayRecursive } from "../../../../structures/class-validator/ClassValidatorArrayRecursive";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)(
    (input: ClassValidatorArrayRecursive[]) => {
        @Controller()
        class NestJsController {
            @Get("stringify")
            public stringify(): ClassValidatorArrayRecursive[] {
                return input.map((i) => 
                    plainToInstance(
                        ClassValidatorArrayRecursive,
                        i,
                    )
                );
            }
        }
        return NestJsController;
    },
);