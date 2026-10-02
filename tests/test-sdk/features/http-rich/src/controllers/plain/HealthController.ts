import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/plain/health")
export class PlainHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
