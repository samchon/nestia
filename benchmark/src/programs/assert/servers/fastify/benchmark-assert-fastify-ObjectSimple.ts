import typia from "typia";

import { ObjectSimple } from "../../../../structures/pure/ObjectSimple";
import { createAjvAssertProgram } from "../createAjvAssertProgram";

createAjvAssertProgram(37_002)(typia.application<[ObjectSimple], "swagger">());
