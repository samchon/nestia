import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/route_manual_assert/health")
export class RouteManualAssertHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
