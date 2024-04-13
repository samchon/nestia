import typia from "typia";

import { Collection } from "../../../../structures/pure/Collection";
import { ObjectHierarchical } from "../../../../structures/pure/ObjectHierarchical";
import { createAjvPerformanceProgram } from "../createAjvPerformanceProgram";

createAjvPerformanceProgram(37_002)(
  typia.json.application<[Collection<ObjectHierarchical>], "3.0">(),
);
