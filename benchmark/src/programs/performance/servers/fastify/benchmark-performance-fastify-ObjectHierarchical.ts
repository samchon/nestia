import typia from "typia";

import { ObjectHierarchical } from "../../../../structures/pure/ObjectHierarchical";
import { createAjvPerformanceProgram } from "../createAjvPerformanceProgram";

createAjvPerformanceProgram(37_002)(
    typia.application<[ObjectHierarchical], "swagger">(),
);
