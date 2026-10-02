import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/date/health")
export class DateHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
