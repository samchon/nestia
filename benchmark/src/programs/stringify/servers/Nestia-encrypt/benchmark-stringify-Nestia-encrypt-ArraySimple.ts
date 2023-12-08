import { Controller } from "@nestjs/common";

import core from "@Nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(false)(37_032)((input: Collection<ArraySimple>) => {
    @Controller()
    class NestiaController {
        @core.EncryptedRoute.Get("stringify")
        public stringify(): Collection<ArraySimple> {
            return input;
        }
    }
    return NestiaController;
});