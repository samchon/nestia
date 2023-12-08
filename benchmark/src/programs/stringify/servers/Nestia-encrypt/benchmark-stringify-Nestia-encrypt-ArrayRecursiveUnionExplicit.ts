import { Controller } from "@nestjs/common";

import core from "@Nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ArrayRecursiveUnionExplicit } from "../../../../structures/pure/ArrayRecursiveUnionExplicit";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(false)(37_032)((input: Collection<ArrayRecursiveUnionExplicit>) => {
    @Controller()
    class NestiaController {
        @core.EncryptedRoute.Get("stringify")
        public stringify(): Collection<ArrayRecursiveUnionExplicit> {
            return input;
        }
    }
    return NestiaController;
});