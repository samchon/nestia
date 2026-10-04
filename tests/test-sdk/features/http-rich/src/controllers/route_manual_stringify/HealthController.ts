import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/route_manual_stringify/health")
export class RouteManualStringifyHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
