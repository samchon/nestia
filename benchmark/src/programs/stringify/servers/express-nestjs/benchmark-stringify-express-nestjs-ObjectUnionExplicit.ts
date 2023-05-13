import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorObjectUnionExplicit } from "../../../../structures/class-validator/ClassValidatorObjectUnionExplicit";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(37_011)(
    (input: ClassValidatorObjectUnionExplicit[]) => {
        @Controller()
        class NestJsController {
            @Get("stringify")
            public stringify(): ClassValidatorObjectUnionExplicit[] {
                return input.map((i) => 
                    plainToInstance(
                        ClassValidatorObjectUnionExplicit,
                        i,
                    )
                );
            }
        }
        return NestJsController;
    },
);