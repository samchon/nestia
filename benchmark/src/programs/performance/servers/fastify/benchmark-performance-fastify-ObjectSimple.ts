import typia from "typia";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectSimple } from "../../../../structures/pure/ObjectSimple";
import { createAjvPerformanceProgram } from "../createAjvPerformanceProgram";

createAjvPerformanceProgram(37_002)(
    typia.application<[Collection<ObjectSimple>], "ajv">()
);