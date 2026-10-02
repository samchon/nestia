import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/status/health")
export class StatusHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
