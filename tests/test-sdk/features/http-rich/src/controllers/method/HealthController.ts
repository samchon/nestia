import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/method/health")
export class MethodHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
