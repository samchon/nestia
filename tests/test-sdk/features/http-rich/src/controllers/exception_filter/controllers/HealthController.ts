import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/exception_filter/health")
export class ExceptionFilterHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
