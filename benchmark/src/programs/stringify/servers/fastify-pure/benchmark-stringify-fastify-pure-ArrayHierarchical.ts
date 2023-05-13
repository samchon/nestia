import typia from "typia";

import { ArrayHierarchical } from "../../../../structures/pure/ArrayHierarchical";
import { createFastifyServerStringifyProgram } from "../createFastifyServerStringifyProgram";

createFastifyServerStringifyProgram(
   typia.application<[ArrayHierarchical[]], "ajv">()
);