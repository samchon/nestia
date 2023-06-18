import typia from "typia";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectUnionExplicit } from "../../../../structures/pure/ObjectUnionExplicit";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram";

createAjvStringifyProgram(37_002)(
    typia.application<[Collection<ObjectUnionExplicit>], "ajv">()
);