import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/headers/health")
export class HeadersHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
