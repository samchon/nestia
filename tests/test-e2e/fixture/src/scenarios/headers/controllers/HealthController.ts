import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("headers/health")
export class HealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
