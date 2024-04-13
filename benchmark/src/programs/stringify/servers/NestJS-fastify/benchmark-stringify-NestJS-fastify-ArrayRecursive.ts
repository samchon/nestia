import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorArrayRecursive } from "../../../../structures/class-validator/ClassValidatorArrayRecursive";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(true)(37_021)(
  (input: ClassValidatorArrayRecursive) => {
    @Controller()
    class NestJsController {
      @Get("stringify")
      public stringify(): ClassValidatorArrayRecursive {
        return plainToInstance(ClassValidatorArrayRecursive, input);
      }
    }
    return NestJsController;
  },
);
