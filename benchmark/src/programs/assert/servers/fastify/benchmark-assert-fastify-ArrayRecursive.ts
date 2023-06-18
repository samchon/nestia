import typia from "typia";

import { Collection } from "../../../../structures/pure/Collection";
import { ArrayRecursive } from "../../../../structures/pure/ArrayRecursive";
import { createAjvAssertProgram } from "../createAjvAssertProgram";

createAjvAssertProgram(37_002)(
    typia.application<[Collection<ArrayRecursive>], "ajv">()
);