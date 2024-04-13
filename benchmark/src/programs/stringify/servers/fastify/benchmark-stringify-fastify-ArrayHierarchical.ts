import typia from "typia";

import { ArrayHierarchical } from "../../../../structures/pure/ArrayHierarchical";
import { Collection } from "../../../../structures/pure/Collection";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram";

createAjvStringifyProgram(37_002)(
  typia.json.application<[Collection<ArrayHierarchical>], "3.0">(),
);
