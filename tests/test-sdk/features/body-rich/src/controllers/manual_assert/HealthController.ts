import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("body_rich/manual_assert/health")
export class ManualAssertHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
