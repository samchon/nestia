import typia from "typia";

import { ArrayRecursiveUnionExplicit } from "../../../../structures/pure/ArrayRecursiveUnionExplicit";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram.ts.legacy";

createAjvStringifyProgram(37_002)(
    typia.application<[ArrayRecursiveUnionExplicit], "swagger">(),
);
