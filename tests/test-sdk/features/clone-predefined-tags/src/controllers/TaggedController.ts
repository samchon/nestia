import core from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

import { ITagged } from "../structures/ITagged";

/**
 * A route whose DTO the SDK clones. Vanilla `@Query()` keeps the server from
 * generating a validator: only the cloned SDK is under test here.
 */
@Controller("tagged")
export class TaggedController {
  @core.TypedRoute.Get()
  public get(@Query() query: ITagged): void {
    query;
  }
}
