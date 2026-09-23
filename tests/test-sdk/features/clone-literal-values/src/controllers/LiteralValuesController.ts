import core from "@nestia/core";
import { Body, Controller, Query } from "@nestjs/common";

import { ILiteralValues, INaNBound } from "../structures/ILiteralValues";

/**
 * Routes whose DTOs the SDK clones. Vanilla decorators keep the server from
 * generating a validator for them: only the cloned SDK is under test here. The
 * NaN bound is a JSON body, because typia refuses its type, and the SDK holds
 * a vanilla `@Query()` to the rules `@TypedQuery()` follows.
 */
@Controller("literal-values")
export class LiteralValuesController {
  @core.TypedRoute.Get()
  public get(@Query() query: ILiteralValues): void {
    query;
  }

  @core.TypedRoute.Post("nan")
  public nan(@Body() body: INaNBound): void {
    body;
  }
}
