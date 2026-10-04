import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/kebab/health")
export class KebabHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
