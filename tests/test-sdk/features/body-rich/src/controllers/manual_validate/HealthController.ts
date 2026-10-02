import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("body_rich/manual_validate/health")
export class ManualValidateHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
