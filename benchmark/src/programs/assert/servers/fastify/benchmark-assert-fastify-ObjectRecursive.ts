import typia from "typia";

import { ObjectRecursive } from "../../../../structures/pure/ObjectRecursive";
import { createAjvAssertProgram } from "../createAjvAssertProgram";

createAjvAssertProgram(37_002)(
    typia.application<[ObjectRecursive], "swagger">(),
);
