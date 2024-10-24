import { ITypiaContext } from "typia/lib/transformers/ITypiaContext";

import { INestiaTransformOptions } from "./INestiaTransformOptions";

export interface INestiaTransformContext
  extends Omit<ITypiaContext, "options"> {
  options: INestiaTransformOptions;
}
