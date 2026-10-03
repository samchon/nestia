import core from "@nestia/core";
import { Body, Controller, Query } from "@nestjs/common";

import { CloneShapesTagsITagged } from "../../../../structures/clone_shapes/tags/CloneShapesTagsITagged";
import { CloneShapesTagsIUnaccepted } from "../../../../structures/clone_shapes/tags/CloneShapesTagsIUnaccepted";

/**
 * Routes whose DTOs the SDK clones. Vanilla `@Query()` and `@Body()` keep the
 * server from generating a validator: only the cloned SDK is under test here.
 */
@Controller("http_rich/options/clone_shapes/tags/tagged")
export class CloneShapesTagsTaggedController {
  @core.TypedRoute.Get()
  public get(@Query() query: CloneShapesTagsITagged): void {
    query;
  }

  @core.TypedRoute.Post("unaccepted")
  public unaccepted(@Body() body: CloneShapesTagsIUnaccepted): void {
    body;
  }
}
