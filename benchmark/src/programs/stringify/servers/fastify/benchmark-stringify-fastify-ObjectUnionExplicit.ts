import typia from "typia";

import { ObjectUnionExplicit } from "../../../../structures/pure/ObjectUnionExplicit";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram.ts.legacy";

createAjvStringifyProgram(37_002)(
    typia.application<[ObjectUnionExplicit], "swagger">(),
);
