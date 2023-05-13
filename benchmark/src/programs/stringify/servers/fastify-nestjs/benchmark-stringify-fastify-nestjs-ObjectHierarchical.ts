import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorObjectHierarchical } from "../../../../structures/class-validator/ClassValidatorObjectHierarchical";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(37_021)(
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