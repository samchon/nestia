import typia from "typia";

import { ObjectRecursive } from "../../../../structures/pure/ObjectRecursive";
import { createFastifyServerStringifyProgram } from "../createFastifyServerStringifyProgram";

createFastifyServerStringifyProgram(
   typia.application<[ObjectRecursive[]], "ajv">()
);