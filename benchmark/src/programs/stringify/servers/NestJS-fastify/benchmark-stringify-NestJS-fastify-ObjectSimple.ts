import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorObjectSimple } from "../../../../structures/class-validator/ClassValidatorObjectSimple";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(true)(37_021)(
  (input: ClassValidatorObjectSimple) => {
    @Controller()
    class NestJsController {
      @Get("stringify")
      public stringify(): ClassValidatorObjectSimple {
        return plainToInstance(ClassValidatorObjectSimple, input);
      }
    }
    return NestJsController;
  },
);
