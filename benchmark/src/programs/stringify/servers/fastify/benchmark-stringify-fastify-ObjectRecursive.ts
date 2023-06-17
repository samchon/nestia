import typia from "typia";

import { ObjectRecursive } from "../../../../structures/pure/ObjectRecursive";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram.ts.legacy";

createAjvStringifyProgram(37_002)(
    typia.application<[ObjectRecursive], "swagger">(),
);
