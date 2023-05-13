import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorArraySimple } from "../../../../structures/class-validator/ClassValidatorArraySimple";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)(
    (input: ClassValidatorArraySimple[]) => {
        @Controller()
        class NestJsController {
            @Get("stringify")
            public stringify(): ClassValidatorArraySimple[] {
                return input.map((i) => 
                    plainToInstance(
                        ClassValidatorArraySimple,
                        i,
                    )
                );
            }
        }
        return NestJsController;
    },
);