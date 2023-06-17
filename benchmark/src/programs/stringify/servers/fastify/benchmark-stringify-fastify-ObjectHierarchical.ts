import typia from "typia";

import { ObjectHierarchical } from "../../../../structures/pure/ObjectHierarchical";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram.ts.legacy";

createAjvStringifyProgram(37_002)(
    typia.application<[ObjectHierarchical], "swagger">(),
);
