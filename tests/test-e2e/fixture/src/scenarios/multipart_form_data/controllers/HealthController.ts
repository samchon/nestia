import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("multipart_form_data/health")
export class HealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
