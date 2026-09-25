import typia from "typia";

import { IPage } from "../api/structures/IPage";

export const sample = (): IPage.IRequest => typia.random<IPage.IRequest>();
