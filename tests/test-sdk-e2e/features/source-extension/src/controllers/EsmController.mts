import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("source-extension")
export class EsmController {
  @core.TypedRoute.Get("mts")
  public mts(): string {
    return "mts";
  }
}
