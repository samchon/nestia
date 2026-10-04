import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/options/parameter_order/health")
export class OptionalOrderHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
