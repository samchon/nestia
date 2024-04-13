import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorObjectRecursive } from "../../../../structures/class-validator/ClassValidatorObjectRecursive";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(true)(37_021)(
  (input: ClassValidatorObjectRecursive) => {
    @Controller()
    class NestJsController {
      @Get("stringify")
      public stringify(): ClassValidatorObjectRecursive {
        return plainToInstance(ClassValidatorObjectRecursive, input);
      }
    }
    return NestJsController;
  },
);
