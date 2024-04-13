import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorArrayRecursiveUnionExplicit } from "../../../../structures/class-validator/ClassValidatorArrayRecursiveUnionExplicit";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(true)(37_021)(
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
