import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("body_rich/manual_is/health")
export class ManualIsHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
