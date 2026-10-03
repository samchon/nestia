import core from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

import { CloneShapesLiteralILiteralValues } from "../../../../structures/clone_shapes/literal/CloneShapesLiteralILiteralValues";

/**
 * Routes whose DTOs the SDK clones. Vanilla `@Query()` keeps the server from
 * generating a validator for them: only the cloned SDK is under test here.
 */
@Controller("http_rich/options/clone_shapes/literal/literal-values")
export class CloneShapesLiteralLiteralValuesController {
  @core.TypedRoute.Get()
  public get(@Query() query: CloneShapesLiteralILiteralValues): void {
    query;
  }
}
