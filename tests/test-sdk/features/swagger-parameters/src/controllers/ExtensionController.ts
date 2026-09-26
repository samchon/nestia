import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { INonFiniteExtensions } from "@api/lib/structures/INonFiniteExtensions";

@Controller("extension")
export class ExtensionController {
  @core.TypedRoute.Get("non-finite")
  public nonFinite(
    @core.TypedQuery() query: INonFiniteExtensions,
  ): INonFiniteExtensions {
    return query;
  }
}
