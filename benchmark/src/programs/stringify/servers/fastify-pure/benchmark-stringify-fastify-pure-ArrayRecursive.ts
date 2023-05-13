import typia from "typia";

import { ArrayRecursive } from "../../../../structures/pure/ArrayRecursive";
import { createFastifyServerStringifyProgram } from "../createFastifyServerStringifyProgram";

createFastifyServerStringifyProgram(
   typia.application<[ArrayRecursive[]], "ajv">()
);