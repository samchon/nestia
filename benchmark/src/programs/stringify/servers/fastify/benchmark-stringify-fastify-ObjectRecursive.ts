import typia from "typia";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectRecursive } from "../../../../structures/pure/ObjectRecursive";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram";

createAjvStringifyProgram(37_002)(
  typia.json.application<[Collection<ObjectRecursive>], "3.0">(),
);
