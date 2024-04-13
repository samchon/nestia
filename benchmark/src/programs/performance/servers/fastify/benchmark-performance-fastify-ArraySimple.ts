import typia from "typia";

import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { Collection } from "../../../../structures/pure/Collection";
import { createAjvPerformanceProgram } from "../createAjvPerformanceProgram";

createAjvPerformanceProgram(37_002)(
  typia.json.application<[Collection<ArraySimple>], "3.0">(),
);
