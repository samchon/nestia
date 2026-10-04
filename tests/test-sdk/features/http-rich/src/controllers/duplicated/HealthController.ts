import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/duplicated/health")
export class DuplicatedHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
