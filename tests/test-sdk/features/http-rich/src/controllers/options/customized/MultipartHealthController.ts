import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/options/customized/multipart_health")
export class MultipartHealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
