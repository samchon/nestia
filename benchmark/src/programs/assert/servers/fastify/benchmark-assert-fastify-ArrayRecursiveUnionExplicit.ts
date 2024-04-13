import typia from "typia";

import { ArrayRecursiveUnionExplicit } from "../../../../structures/pure/ArrayRecursiveUnionExplicit";
import { Collection } from "../../../../structures/pure/Collection";
import { createAjvAssertProgram } from "../createAjvAssertProgram";

createAjvAssertProgram(37_002)(
  typia.json.application<[Collection<ArrayRecursiveUnionExplicit>], "3.0">(),
);
