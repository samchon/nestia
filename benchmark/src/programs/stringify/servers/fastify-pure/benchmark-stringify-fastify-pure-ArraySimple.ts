import typia from "typia";

import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { createFastifyServerStringifyProgram } from "../createFastifyServerStringifyProgram";

createFastifyServerStringifyProgram(
   typia.application<[ArraySimple[]], "ajv">()
);