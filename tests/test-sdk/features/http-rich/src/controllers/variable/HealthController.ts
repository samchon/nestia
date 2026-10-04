import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/variable/health")
export class VariableHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
