import typia from "typia";

import { ObjectHierarchical } from "../../../../structures/pure/ObjectHierarchical";
import { createFastifyServerStringifyProgram } from "../createFastifyServerStringifyProgram";

createFastifyServerStringifyProgram(
   typia.application<[ObjectHierarchical[]], "ajv">()
);