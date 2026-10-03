import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/options/validate_log/health")
export class ValidateLogHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
