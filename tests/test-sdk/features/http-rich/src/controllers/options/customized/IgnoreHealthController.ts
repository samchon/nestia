import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/options/customized/ignore_health")
export class IgnoreHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
