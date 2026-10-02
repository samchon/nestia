import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("body_rich/optional/health")
export class OptionalHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
