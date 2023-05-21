import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorObjectSimple } from "../../../../structures/class-validator/ClassValidatorObjectSimple";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(true)(37_011)(
    (input: ClassValidatorObjectSimple) => {
        @Controller()
        class NestJsController {
            @Get("stringify")
            public stringify(): ClassValidatorObjectSimple {
                return plainToInstance(
                    ClassValidatorObjectSimple,
                    input,
                );
            }
        }
        return NestJsController;
    },
);