import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/route_manual_is/health")
export class RouteManualIsHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
