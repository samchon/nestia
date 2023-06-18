import typia from "typia";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectRecursive } from "../../../../structures/pure/ObjectRecursive";
import { createAjvAssertProgram } from "../createAjvAssertProgram";

createAjvAssertProgram(37_002)(
    typia.application<[Collection<ObjectRecursive>], "ajv">()
);