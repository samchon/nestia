import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/route_human/health")
export class RouteHumanHealthController {
  @core.HumanRoute()
  @core.TypedRoute.Get()
  public get(): void {}
}
