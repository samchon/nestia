import typia from "typia";

import { Collection } from "../../../../structures/pure/Collection";
import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { createAjvPerformanceProgram } from "../createAjvPerformanceProgram";

createAjvPerformanceProgram(37_002)(
    typia.application<[Collection<ArraySimple>], "ajv">()
);