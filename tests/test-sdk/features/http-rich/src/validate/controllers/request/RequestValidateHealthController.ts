import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/options/request_validate/health")
export class RequestValidateHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
