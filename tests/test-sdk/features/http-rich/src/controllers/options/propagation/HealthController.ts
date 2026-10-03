import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/options/propagation/health")
export class PropagationHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
