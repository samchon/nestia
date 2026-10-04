import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/clone/common/health")
export class CloneCommonHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
