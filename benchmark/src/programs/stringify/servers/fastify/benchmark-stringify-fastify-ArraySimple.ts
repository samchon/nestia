import typia from "typia";

import { Collection } from "../../../../structures/pure/Collection";
import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram";

createAjvStringifyProgram(37_002)(
    typia.application<[Collection<ArraySimple>], "ajv">()
);