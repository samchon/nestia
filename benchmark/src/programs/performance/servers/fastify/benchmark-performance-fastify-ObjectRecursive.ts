import typia from "typia";

import { ObjectRecursive } from "../../../../structures/pure/ObjectRecursive";
import { createAjvPerformanceProgram } from "../createAjvPerformanceProgram";

createAjvPerformanceProgram(37_002)(
    typia.application<[ObjectRecursive], "swagger">(),
);
