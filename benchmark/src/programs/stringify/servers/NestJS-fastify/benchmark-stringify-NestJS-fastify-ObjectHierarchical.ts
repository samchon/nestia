import { Controller, Get } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { ClassValidatorObjectHierarchical } from "../../../../structures/class-validator/ClassValidatorObjectHierarchical";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(true)(37_021)(
  (input: ClassValidatorObjectHierarchical) => {
    @Controller()
    class NestJsController {
      @Get("stringify")
      public stringify(): ClassValidatorObjectHierarchical {
        return plainToInstance(ClassValidatorObjectHierarchical, input);
      }
    }
    return NestJsController;
  },
);
