import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/route/health")
export class RouteHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
