import core from "@nestia/core";
import { Body, Controller, Query } from "@nestjs/common";

import { ITagged } from "../structures/ITagged";
import { IUnaccepted } from "../structures/IUnaccepted";

/**
 * Routes whose DTOs the SDK clones. Vanilla `@Query()` and `@Body()` keep the
 * server from generating a validator: only the cloned SDK is under test here.
 */
@Controller("tagged")
export class TaggedController {
  @core.TypedRoute.Get()
  public get(@Query() query: ITagged): void {
    query;
  }

  @core.TypedRoute.Post("unaccepted")
  public unaccepted(@Body() body: IUnaccepted): void {
    body;
  }
}
