import typia from "typia";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectSimple } from "../../../../structures/pure/ObjectSimple";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram";

createAjvStringifyProgram(37_002)(
    typia.json.application<[Collection<ObjectSimple>], "ajv">()
);