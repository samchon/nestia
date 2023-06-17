import typia from "typia";

import { ArrayHierarchical } from "../../../../structures/pure/ArrayHierarchical";
import { createAjvAssertProgram } from "../createAjvAssertProgram";

createAjvAssertProgram(37_002)(
    typia.application<[ArrayHierarchical], "swagger">(),
);
