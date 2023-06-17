import typia from "typia";

import { ObjectHierarchical } from "../../../../structures/pure/ObjectHierarchical";
import { createAjvAssertProgram } from "../createAjvAssertProgram";

createAjvAssertProgram(37_002)(
    typia.application<[ObjectHierarchical], "swagger">(),
);
