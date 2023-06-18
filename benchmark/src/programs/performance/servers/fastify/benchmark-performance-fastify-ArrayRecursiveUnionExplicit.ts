import typia from "typia";

import { Collection } from "../../../../structures/pure/Collection";
import { ArrayRecursiveUnionExplicit } from "../../../../structures/pure/ArrayRecursiveUnionExplicit";
import { createAjvPerformanceProgram } from "../createAjvPerformanceProgram";

createAjvPerformanceProgram(37_002)(
    typia.application<[Collection<ArrayRecursiveUnionExplicit>], "ajv">()
);