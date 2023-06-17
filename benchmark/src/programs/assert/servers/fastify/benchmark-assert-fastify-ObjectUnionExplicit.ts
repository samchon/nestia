import typia from "typia";

import { ObjectUnionExplicit } from "../../../../structures/pure/ObjectUnionExplicit";
import { createAjvAssertProgram } from "../createAjvAssertProgram";

createAjvAssertProgram(37_002)(
    typia.application<[ObjectUnionExplicit], "swagger">(),
);
