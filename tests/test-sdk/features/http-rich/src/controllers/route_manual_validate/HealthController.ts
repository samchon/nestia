import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/route_manual_validate/health")
export class RouteManualValidateHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
