import typia from "typia";

import { Collection } from "../../../../structures/pure/Collection";
import { ArrayRecursiveUnionExplicit } from "../../../../structures/pure/ArrayRecursiveUnionExplicit";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram";

createAjvStringifyProgram(37_002)(
    typia.application<[Collection<ArrayRecursiveUnionExplicit>], "ajv">()
);