import { Controller } from "@nestjs/common";

import core from "@Nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectUnionExplicit } from "../../../../structures/pure/ObjectUnionExplicit";
import { createNestFastifyStringifyProgram } from "../createNestFastifyStringifyProgram";

createNestFastifyStringifyProgram(false)(37_032)((input: Collection<ObjectUnionExplicit>) => {
    @Controller()
    class NestiaController {
        @core.EncryptedRoute.Get("stringify")
        public stringify(): Collection<ObjectUnionExplicit> {
            return input;
        }
    }
    return NestiaController;
});