import typia from "typia";

import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { createAjvPerformanceProgram } from "../createAjvPerformanceProgram";

createAjvPerformanceProgram(37_002)(
    typia.application<[ArraySimple], "swagger">(),
);
