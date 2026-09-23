import core from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

import { ILiteralValues, INaNBound } from "../structures/ILiteralValues";

/**
 * Routes whose DTOs the SDK clones. Vanilla `@Query()` keeps the server from
 * generating a validator for them: only the cloned SDK is under test here.
 */
@Controller("literal-values")
export class LiteralValuesController {
  @core.TypedRoute.Get()
  public get(@Query() query: ILiteralValues): void {
    query;
  }

  @core.TypedRoute.Get("nan")
  public nan(@Query() query: INaNBound): void {
    query;
  }
}
