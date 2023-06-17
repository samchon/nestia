import typia from "typia";

import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram";

createAjvStringifyProgram(37_002)(
    typia.application<[ArraySimple], "swagger">(),
);
