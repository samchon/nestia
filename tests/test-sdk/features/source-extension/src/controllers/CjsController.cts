import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("source-extension")
export class CjsController {
  @core.TypedRoute.Get("cts")
  public cts(): string {
    return "cts";
  }
}
