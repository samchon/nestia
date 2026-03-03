import { ITypiaContext } from "@typia/core";

import { INestiaTransformOptions } from "./INestiaTransformOptions";

export interface INestiaTransformContext extends Omit<
  ITypiaContext,
  "options"
> {
  options: INestiaTransformOptions;
}
