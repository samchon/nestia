import typia from "typia";

import { ArrayRecursive } from "../../../../structures/pure/ArrayRecursive";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram.ts.legacy";

createAjvStringifyProgram(37_002)(
    typia.application<[ArrayRecursive], "swagger">(),
);
