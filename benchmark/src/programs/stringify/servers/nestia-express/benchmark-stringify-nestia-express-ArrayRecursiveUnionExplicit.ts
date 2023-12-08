import { Controller } from "@nestjs/common";

import core from "@Nestia/core";

import { Collection } from "../../../../structures/pure/Collection";
import { ArrayRecursiveUnionExplicit } from "../../../../structures/pure/ArrayRecursiveUnionExplicit";
import { createNestExpressStringifyProgram } from "../createNestExpressStringifyProgram";

createNestExpressStringifyProgram(false)(37_012)((input: Collection<ArrayRecursiveUnionExplicit>) => {
    @Controller()
    class NestiaController {
        @core.TypedRoute.Get("stringify")
        public stringify(): Collection<ArrayRecursiveUnionExplicit> {
            return input;
        }
    }
    return NestiaController;
});