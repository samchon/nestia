import typia from "typia";

import { ArrayRecursiveUnionExplicit } from "../../../../structures/pure/ArrayRecursiveUnionExplicit";
import { createFastifyServerStringifyProgram } from "../createFastifyServerStringifyProgram";

createFastifyServerStringifyProgram(
   typia.application<[ArrayRecursiveUnionExplicit[]], "ajv">()
);