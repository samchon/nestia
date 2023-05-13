import typia from "typia";

import { ObjectSimple } from "../../../../structures/pure/ObjectSimple";
import { createFastifyServerStringifyProgram } from "../createFastifyServerStringifyProgram";

createFastifyServerStringifyProgram(
   typia.application<[ObjectSimple[]], "ajv">()
);