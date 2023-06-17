import typia from "typia";

import { ObjectSimple } from "../../../../structures/pure/ObjectSimple";
import { createAjvPerformanceProgram } from "../createAjvPerformanceProgram";

createAjvPerformanceProgram(37_002)(
    typia.application<[ObjectSimple], "swagger">(),
);
