import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/non_equals/health")
export class NonEqualsHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
