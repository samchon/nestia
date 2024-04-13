import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorObjectUnionExplicit } from "../../../../structures/class-validator/ClassValidatorObjectUnionExplicit";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(true)(37_011)(
  (input: ClassValidatorObjectUnionExplicit) => {
    @Controller()
    class NestJsController {
      @Get("stringify")
      public stringify(): ClassValidatorObjectUnionExplicit {
        return plainToInstance(ClassValidatorObjectUnionExplicit, input);
      }
    }
    return NestJsController;
  },
);
