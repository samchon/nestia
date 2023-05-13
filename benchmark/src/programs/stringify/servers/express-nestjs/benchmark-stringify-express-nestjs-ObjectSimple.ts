import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorObjectSimple } from "../../../../structures/class-validator/ClassValidatorObjectSimple";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)(
    (input: ClassValidatorObjectSimple[]) => {
        @Controller()
        class NestJsController {
            @Get("stringify")
            public stringify(): ClassValidatorObjectSimple[] {
                return input.map((i) => 
                    plainToInstance(
                        ClassValidatorObjectSimple,
                        i,
                    )
                );
            }
        }
        return NestJsController;
    },
);