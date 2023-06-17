import typia from "typia";

import { ArraySimple } from "../../../../structures/pure/ArraySimple";
import { createAjvAssertProgram } from "../createAjvAssertProgram";

createAjvAssertProgram(37_002)(typia.application<[ArraySimple], "swagger">());
