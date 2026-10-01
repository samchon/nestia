import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("websocket/health")
export class HealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
