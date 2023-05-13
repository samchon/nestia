import typia from "typia";

import { ObjectUnionExplicit } from "../../../../structures/pure/ObjectUnionExplicit";
import { createFastifyServerStringifyProgram } from "../createFastifyServerStringifyProgram";

createFastifyServerStringifyProgram(
   typia.application<[ObjectUnionExplicit[]], "ajv">()
);