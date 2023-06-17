import typia from "typia";

import { ObjectSimple } from "../../../../structures/pure/ObjectSimple";
import { createAjvStringifyProgram } from "../createAjvStringifyProgram";

createAjvStringifyProgram(37_002)(
    typia.application<[ObjectSimple], "swagger">(),
);
