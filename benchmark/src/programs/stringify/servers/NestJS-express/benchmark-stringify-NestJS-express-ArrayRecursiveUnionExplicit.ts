import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorArrayRecursiveUnionExplicit } from "../../../../structures/class-validator/ClassValidatorArrayRecursiveUnionExplicit";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(true)(37_011)(
    (input: ClassValidatorArrayRecursiveUnionExplicit) => {
        @Controller()
        class NestJsController {
            @Get("stringify")
            public stringify(): ClassValidatorArrayRecursiveUnionExplicit {
                return plainToInstance(
                    ClassValidatorArrayRecursiveUnionExplicit,
                    input,
                );
            }
        }
        return NestJsController;
    },
);