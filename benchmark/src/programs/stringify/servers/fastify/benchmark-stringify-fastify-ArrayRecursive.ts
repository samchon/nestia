import typia from "typia";

import { ArrayRecursive } from "../../../../structures/pure/ArrayRecursive";
import { Collection } from "../../../../structures/pure/Collection";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram";

createAjvStringifyProgram(37_002)(
  typia.json.application<[Collection<ArrayRecursive>], "3.0">(),
);
