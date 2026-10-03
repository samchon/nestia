import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/options/all_method/health")
export class AllMethodHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
