import typia from "typia";

import { ObjectUnionExplicit } from "../../../../structures/pure/ObjectUnionExplicit";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram";

createAjvStringifyProgram(37_002)(
    typia.application<[ObjectUnionExplicit], "swagger">(),
);
