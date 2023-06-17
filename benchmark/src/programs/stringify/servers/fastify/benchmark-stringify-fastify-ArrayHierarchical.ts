import typia from "typia";

import { ArrayHierarchical } from "../../../../structures/pure/ArrayHierarchical";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram";

createAjvStringifyProgram(37_002)(
    typia.application<[ArrayHierarchical], "swagger">(),
);
