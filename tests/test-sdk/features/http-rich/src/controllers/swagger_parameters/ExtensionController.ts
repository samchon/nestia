import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { INonFiniteExtensions } from "../../structures/swagger_parameters/INonFiniteExtensions";

@Controller("http_rich/swagger_parameters/extension")
export class RichSwaggerExtensionController {
  @core.TypedRoute.Get("non-finite")
  public nonFinite(
    @core.TypedQuery() query: INonFiniteExtensions,
  ): INonFiniteExtensions {
    return query;
  }
}
