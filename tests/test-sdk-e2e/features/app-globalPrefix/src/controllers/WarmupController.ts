import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("_ah")
export class WarmupController {
  @core.TypedRoute.Get("warmup")
  public warmup(): string {
    return "ok";
  }
}
